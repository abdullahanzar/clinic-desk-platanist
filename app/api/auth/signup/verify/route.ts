import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createSession } from "@/lib/auth/session";
import { ensureIndexes, getClinicsCollection, getPendingSignupsCollection, getUsersCollection } from "@/lib/db/collections";
import {
  buildDefaultPublicProfile,
  hashOtpCode,
  MAX_OTP_ATTEMPTS,
} from "@/lib/auth/signup-verification";
import type { ClinicInsert, UserInsert } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signupId, otp } = body;

    if (!signupId || !otp) {
      return NextResponse.json(
        { error: "signupId and otp are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(signupId)) {
      return NextResponse.json(
        { error: "Invalid signup ID" },
        { status: 400 }
      );
    }

    await ensureIndexes();

    const pendingSignups = await getPendingSignupsCollection();
    const pendingSignup = await pendingSignups.findOne({ _id: new ObjectId(signupId) });

    if (!pendingSignup) {
      return NextResponse.json(
        { error: "Signup not found or already verified" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (pendingSignup.expiresAt <= now) {
      await pendingSignups.deleteOne({ _id: pendingSignup._id });
      return NextResponse.json(
        { error: "Verification code expired. Request a new code to continue." },
        { status: 400 }
      );
    }

    if (pendingSignup.verificationAttemptCount >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many verification attempts. Request a new code." },
        { status: 429 }
      );
    }

    const expectedOtpHash = hashOtpCode(
      otp.trim(),
      pendingSignup.doctor.email,
      pendingSignup.clinic.slug
    );

    if (expectedOtpHash !== pendingSignup.otpHash) {
      const nextAttemptCount = pendingSignup.verificationAttemptCount + 1;

      await pendingSignups.updateOne(
        { _id: pendingSignup._id },
        {
          $set: {
            verificationAttemptCount: nextAttemptCount,
            updatedAt: now,
          },
        }
      );

      return NextResponse.json(
        {
          error:
            nextAttemptCount >= MAX_OTP_ATTEMPTS
              ? "Too many verification attempts. Request a new code."
              : "Invalid verification code",
        },
        { status: nextAttemptCount >= MAX_OTP_ATTEMPTS ? 429 : 400 }
      );
    }

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    const [existingClinic, existingUser] = await Promise.all([
      clinics.findOne({ slug: pendingSignup.clinic.slug }),
      users.findOne({ email: pendingSignup.doctor.email }),
    ]);

    if (existingClinic || existingUser) {
      return NextResponse.json(
        { error: "This signup can no longer be completed because the account details are already in use" },
        { status: 409 }
      );
    }

    const clinic: ClinicInsert = {
      name: pendingSignup.clinic.name,
      slug: pendingSignup.clinic.slug,
      address: pendingSignup.clinic.address,
      phone: pendingSignup.clinic.phone,
      email: pendingSignup.clinic.email,
      website: pendingSignup.clinic.website,
      currentSharedReceiptId: null,
      currentSharedReceiptExpiresAt: null,
      receiptShareDurationMinutes: 10,
      publicProfile: buildDefaultPublicProfile(pendingSignup.doctor.name),
      createdAt: now,
      updatedAt: now,
    };

    const clinicResult = await clinics.insertOne(clinic as never);

    try {
      const user: UserInsert = {
        clinicId: clinicResult.insertedId,
        name: pendingSignup.doctor.name,
        email: pendingSignup.doctor.email,
        passwordHash: pendingSignup.doctor.passwordHash,
        role: "doctor",
        isActive: true,
        emailVerifiedAt: now,
        loginHistory: [],
        createdAt: now,
        updatedAt: now,
      };

      const userResult = await users.insertOne(user as never);

      await pendingSignups.deleteOne({ _id: pendingSignup._id });
      await createSession(
        userResult.insertedId.toString(),
        clinicResult.insertedId.toString(),
        "doctor"
      );

      return NextResponse.json({
        success: true,
        user: {
          id: userResult.insertedId.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        clinic: {
          id: clinicResult.insertedId.toString(),
          name: clinic.name,
          slug: clinic.slug,
        },
      });
    } catch (error) {
      await clinics.deleteOne({ _id: clinicResult.insertedId });
      throw error;
    }
  } catch (error) {
    console.error("Signup verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}