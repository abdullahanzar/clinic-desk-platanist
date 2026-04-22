import nodemailer from "nodemailer";
import { OTP_EXPIRY_MINUTES } from "@/lib/auth/signup-verification";

type SignupOtpEmailInput = {
  clinicName: string;
  doctorName: string;
  otp: string;
  signupId: string;
  toEmail: string;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for SMTP email delivery`);
  }
  return value;
}

function parseSmtpPort(): number {
  const value = process.env.SMTP_PORT || "587";
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid positive integer");
  }
  return port;
}

function isSmtpSecure(port: number): boolean {
  if (process.env.SMTP_SECURE) {
    return process.env.SMTP_SECURE === "true";
  }
  return port === 465;
}

function buildFromAddress(): string {
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL");
  const fromName = process.env.SMTP_FROM_NAME?.trim();

  if (!fromName) {
    return fromEmail;
  }

  return `${fromName} <${fromEmail}>`;
}

function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM_EMAIL
  );
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    const port = parseSmtpPort();

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: getRequiredEnv("SMTP_HOST"),
        port,
        secure: isSmtpSecure(port),
        auth: {
          user: getRequiredEnv("SMTP_USER"),
          pass: getRequiredEnv("SMTP_PASS"),
        },
      })
    );
  }

  return transporterPromise;
}

export async function sendSignupOtpEmail({
  clinicName,
  doctorName,
  otp,
  signupId,
  toEmail,
}: SignupOtpEmailInput): Promise<void> {
  const transporter = await getTransporter();
  const verificationUrl = `${getAppBaseUrl()}/register/verify?signupId=${encodeURIComponent(
    signupId
  )}&email=${encodeURIComponent(toEmail)}`;

  const escapedClinicName = escapeHtml(clinicName);
  const escapedDoctorName = escapeHtml(doctorName);
  const escapedOtp = escapeHtml(otp);
  const escapedVerificationUrl = escapeHtml(verificationUrl);

  await transporter.sendMail({
    from: buildFromAddress(),
    to: toEmail,
    replyTo: process.env.SMTP_REPLY_TO || undefined,
    subject: `Verify your Clinic Desk account for ${clinicName}`,
    text: [
      `Hi ${doctorName},`,
      "",
      `Use this one-time verification code to finish setting up ${clinicName} on Clinic Desk:`,
      "",
      otp,
      "",
      `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      `Open ${verificationUrl} to enter it and complete your signup.`,
      "",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px 28px; color: #ffffff;">
            <p style="margin: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.88;">Clinic Desk</p>
            <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.2;">Verify your doctor account</h1>
          </div>
          <div style="padding: 28px;">
            <p style="margin: 0 0 12px; font-size: 16px;">Hi ${escapedDoctorName},</p>
            <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #334155;">
              Enter this one-time code to finish setting up <strong>${escapedClinicName}</strong> on Clinic Desk.
            </p>
            <div style="margin: 24px 0; padding: 18px; border-radius: 14px; background: #e0f2fe; border: 1px solid #bae6fd; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #0369a1;">Verification code</p>
              <p style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 0.22em; color: #0f172a;">${escapedOtp}</p>
            </div>
            <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
              This code expires in ${OTP_EXPIRY_MINUTES} minutes.
            </p>
            <p style="margin: 0 0 22px; font-size: 14px; color: #475569; line-height: 1.7;">
              Open the verification screen here if you need it:<br />
              <a href="${escapedVerificationUrl}" style="color: #0369a1;">${escapedVerificationUrl}</a>
            </p>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
              If you did not request this email, you can safely ignore it.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}