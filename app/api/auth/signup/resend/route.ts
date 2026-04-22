import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPendingSignupsCollection } from "@/lib/db/collections";
import {
  generateOtpCode,
  getOtpExpiryDate,
  getSecondsUntilResend,
  hashOtpCode,
  MAX_OTP_RESENDS,
} from "@/lib/auth/signup-verification";
import { isSmtpConfigured, sendSignupOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "Email delivery is not configured yet" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { signupId } = body;

    if (!signupId) {
      return NextResponse.json(
        { error: "signupId is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(signupId)) {
      return NextResponse.json(
        { error: "Invalid signup ID" },
        { status: 400 }
      );
    }

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
        { error: "Verification code expired. Start signup again." },
        { status: 400 }
      );
    }

    const secondsRemaining = getSecondsUntilResend(pendingSignup.lastSentAt);
    if (secondsRemaining > 0) {
      return NextResponse.json(
        {
          error: "Please wait before requesting another code",
          secondsRemaining,
        },
        { status: 429 }
      );
    }

    if (pendingSignup.resendCount >= MAX_OTP_RESENDS) {
      return NextResponse.json(
        { error: "Maximum resend attempts reached. Start signup again." },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const expiresAt = getOtpExpiryDate();

    await pendingSignups.updateOne(
      { _id: pendingSignup._id },
      {
        $set: {
          otpHash: hashOtpCode(otp, pendingSignup.doctor.email, pendingSignup.clinic.slug),
          expiresAt,
          lastSentAt: now,
          updatedAt: now,
          verificationAttemptCount: 0,
        },
        $inc: {
          resendCount: 1,
        },
      }
    );

    await sendSignupOtpEmail({
      clinicName: pendingSignup.clinic.name,
      doctorName: pendingSignup.doctor.name,
      otp,
      signupId: pendingSignup._id.toString(),
      toEmail: pendingSignup.doctor.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup resend error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}