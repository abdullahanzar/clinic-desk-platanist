import { createHmac, randomInt } from "node:crypto";
import type { PublicProfile } from "@/types";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
export const OTP_LENGTH = 6;
export const MAX_OTP_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_OTP_RESENDS = 3;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLINIC_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getOtpHashSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required for signup verification");
  }
  return secret;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeClinicSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidClinicSlug(slug: string): boolean {
  return CLINIC_SLUG_REGEX.test(slug);
}

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(otp: string, email: string, clinicSlug: string): string {
  return createHmac("sha256", getOtpHashSecret())
    .update(`${normalizeEmail(email)}:${normalizeClinicSlug(clinicSlug)}:${otp}`)
    .digest("hex");
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function getSecondsUntilResend(lastSentAt?: Date | null): number {
  if (!lastSentAt) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - lastSentAt.getTime()) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
}

export function maskEmailAddress(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  const [localPart, domain = ""] = normalizedEmail.split("@");

  if (!localPart) {
    return normalizedEmail;
  }

  const visibleLocal = localPart.length <= 2
    ? `${localPart[0] || ""}*`
    : `${localPart.slice(0, 2)}${"*".repeat(Math.max(1, localPart.length - 2))}`;

  return `${visibleLocal}@${domain}`;
}

export function buildDefaultPublicProfile(doctorName: string): PublicProfile {
  return {
    enabled: false,
    doctorName,
    qualifications: "",
    specialization: "",
    timings: "",
  };
}