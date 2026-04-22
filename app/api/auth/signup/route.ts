import { NextResponse } from "next/server";
import { ensureIndexes, getClinicsCollection, getPendingSignupsCollection, getUsersCollection } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  isValidClinicSlug,
  isValidEmailAddress,
  maskEmailAddress,
  normalizeClinicSlug,
  normalizeEmail,
} from "@/lib/auth/signup-verification";
import { isSmtpConfigured, sendSignupOtpEmail } from "@/lib/email";
import type { PendingSignupInsert } from "@/types";

export async function POST(request: Request) {
  try {
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "Email delivery is not configured yet" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      clinicName,
      clinicSlug,
      address,
      phone,
      clinicEmail,
      website,
      doctorName,
      doctorEmail,
      password,
    } = body;

    if (!clinicName || !clinicSlug || !phone || !doctorName || !doctorEmail || !password) {
      return NextResponse.json(
        {
          error:
            "Required fields: clinicName, clinicSlug, phone, doctorName, doctorEmail, password",
        },
        { status: 400 }
      );
    }

    if (!address || !address.line1 || !address.city || !address.state || !address.pincode) {
      return NextResponse.json(
        { error: "Address must include line1, city, state, and pincode" },
        { status: 400 }
      );
    }

    const normalizedDoctorEmail = normalizeEmail(doctorEmail);
    const normalizedClinicEmail = clinicEmail ? normalizeEmail(clinicEmail) : undefined;
    const normalizedClinicSlug = normalizeClinicSlug(clinicSlug);

    if (!isValidEmailAddress(normalizedDoctorEmail)) {
      return NextResponse.json(
        { error: "Invalid doctor email format" },
        { status: 400 }
      );
    }

    if (normalizedClinicEmail && !isValidEmailAddress(normalizedClinicEmail)) {
      return NextResponse.json(
        { error: "Invalid clinic email format" },
        { status: 400 }
      );
    }

    if (!isValidClinicSlug(normalizedClinicSlug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase with hyphens only (e.g., 'my-clinic')" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await ensureIndexes();

    const pendingSignups = await getPendingSignupsCollection();
    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();
    const now = new Date();

    await pendingSignups.deleteMany({
      expiresAt: { $lte: now },
      $or: [{ "doctor.email": normalizedDoctorEmail }, { "clinic.slug": normalizedClinicSlug }],
    });

    const [existingUser, existingClinic, existingPendingSignup] = await Promise.all([
      users.findOne({ email: normalizedDoctorEmail }),
      clinics.findOne({ slug: normalizedClinicSlug }),
      pendingSignups.findOne({
        $or: [{ "doctor.email": normalizedDoctorEmail }, { "clinic.slug": normalizedClinicSlug }],
      }),
    ]);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    if (existingClinic) {
      return NextResponse.json(
        { error: "Clinic slug already exists" },
        { status: 409 }
      );
    }

    if (existingPendingSignup) {
      const isSameSignup =
        existingPendingSignup.doctor.email === normalizedDoctorEmail &&
        existingPendingSignup.clinic.slug === normalizedClinicSlug;

      return NextResponse.json(
        {
          error: isSameSignup
            ? "This signup is already pending email verification"
            : "This email or clinic slug is already reserved by another pending signup",
          code: isSameSignup ? "PENDING_SIGNUP_EXISTS" : "PENDING_SIGNUP_CONFLICT",
          signupId: isSameSignup ? existingPendingSignup._id.toString() : undefined,
          email: isSameSignup ? normalizedDoctorEmail : undefined,
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const otp = generateOtpCode();

    const pendingSignup: PendingSignupInsert = {
      clinic: {
        name: clinicName.trim(),
        slug: normalizedClinicSlug,
        address: {
          line1: address.line1.trim(),
          line2: address.line2?.trim() || undefined,
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
        },
        phone: phone.trim(),
        email: normalizedClinicEmail,
        website: website?.trim() || undefined,
      },
      doctor: {
        name: doctorName.trim(),
        email: normalizedDoctorEmail,
        passwordHash,
      },
      otpHash: hashOtpCode(otp, normalizedDoctorEmail, normalizedClinicSlug),
      expiresAt: getOtpExpiryDate(),
      lastSentAt: now,
      resendCount: 0,
      verificationAttemptCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await pendingSignups.insertOne(pendingSignup as never);

    try {
      await sendSignupOtpEmail({
        clinicName: pendingSignup.clinic.name,
        doctorName: pendingSignup.doctor.name,
        otp,
        signupId: result.insertedId.toString(),
        toEmail: pendingSignup.doctor.email,
      });
    } catch (error) {
      await pendingSignups.deleteOne({ _id: result.insertedId });
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        signupId: result.insertedId.toString(),
        email: pendingSignup.doctor.email,
        maskedEmail: maskEmailAddress(pendingSignup.doctor.email),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}