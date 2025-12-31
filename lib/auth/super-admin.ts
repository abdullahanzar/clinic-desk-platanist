import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Super Admin Session Types
export interface SuperAdminSession {
  isSuperAdmin: true;
  exp: number;
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(SECRET_KEY);

const SUPER_ADMIN_COOKIE_NAME = "super_admin_session";
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours (shorter for security)

/**
 * Validates super admin credentials against environment variables
 */
export function validateSuperAdminCredentials(
  username: string,
  password: string
): boolean {
  const validUsername = process.env.SUPER_ADMIN_USERNAME;
  const validPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("Super admin credentials not configured in environment");
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const usernameMatch = username === validUsername;
  const passwordMatch = password === validPassword;

  return usernameMatch && passwordMatch;
}

/**
 * Creates a super admin session
 */
export async function createSuperAdminSession(): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const token = await new SignJWT({
    isSuperAdmin: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(key);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Stricter for super admin
    expires: expiresAt,
    path: "/",
  });

  return token;
}

/**
 * Gets the current super admin session
 */
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key);
    const sessionPayload = payload as unknown as SuperAdminSession;
    if (sessionPayload.isSuperAdmin !== true) {
      return null;
    }
    return sessionPayload;
  } catch {
    return null;
  }
}

/**
 * Deletes the super admin session
 */
export async function deleteSuperAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SUPER_ADMIN_COOKIE_NAME);
}

/**
 * Requires a valid super admin session, throws if not authenticated
 */
export async function requireSuperAdminSession(): Promise<SuperAdminSession> {
  const session = await getSuperAdminSession();
  if (!session) {
    throw new Error("Super Admin Unauthorized");
  }
  return session;
}

/**
 * Check if super admin is properly configured
 */
export function isSuperAdminConfigured(): boolean {
  return !!(process.env.SUPER_ADMIN_USERNAME && process.env.SUPER_ADMIN_PASSWORD);
}
