import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/sqlite";
import { superAdmins } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  LoginHistoryEntry,
  SuperAdminRecord,
  SuperAdminSessionPayload,
} from "@/types";

interface SuperAdminValidationResult {
  authenticated: boolean;
  authSource?: "database" | "environment";
  superAdmin?: SuperAdminRecord;
  mustChangeCredentials?: boolean;
  username?: string;
}

interface UpdateSuperAdminCredentialsInput {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(SECRET_KEY);

const SUPER_ADMIN_COOKIE_NAME = "super_admin_session";
const SESSION_DURATION = 2 * 60 * 60 * 1000;
const MAX_LOGIN_HISTORY = 50;

function getEnvironmentSuperAdminCredentials() {
  const username = process.env.SUPER_ADMIN_USERNAME;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function getPersistedSuperAdminById(id: string): SuperAdminRecord | undefined {
  const db = getDb();
  return db.select().from(superAdmins).where(eq(superAdmins.id, id)).get();
}

export function getPersistedSuperAdminByUsername(
  username: string
): SuperAdminRecord | undefined {
  const db = getDb();
  return db.select().from(superAdmins).where(eq(superAdmins.username, username.trim())).get();
}

export function getPrimaryPersistedSuperAdmin(): SuperAdminRecord | undefined {
  const db = getDb();
  return db.select().from(superAdmins).get();
}

export async function validateSuperAdminCredentials(
  username: string,
  password: string
): Promise<SuperAdminValidationResult> {
  const normalizedUsername = username.trim();
  const persistedSuperAdmin = getPersistedSuperAdminByUsername(normalizedUsername);

  if (persistedSuperAdmin) {
    const isValidPassword = await verifyPassword(password, persistedSuperAdmin.passwordHash);
    if (isValidPassword) {
      return {
        authenticated: true,
        authSource: "database",
        superAdmin: persistedSuperAdmin,
        mustChangeCredentials:
          persistedSuperAdmin.mustChangeCredentials ||
          persistedSuperAdmin.usedDefaultCredentials,
        username: persistedSuperAdmin.username,
      };
    }
  }

  const environmentCredentials = getEnvironmentSuperAdminCredentials();
  if (
    environmentCredentials &&
    normalizedUsername === environmentCredentials.username &&
    password === environmentCredentials.password
  ) {
    return {
      authenticated: true,
      authSource: "environment",
      superAdmin: getPrimaryPersistedSuperAdmin(),
      mustChangeCredentials: true,
      username: environmentCredentials.username,
    };
  }

  return { authenticated: false };
}

export async function createSuperAdminSession(
  session: Omit<SuperAdminSessionPayload, "isSuperAdmin" | "exp">
): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const token = await new SignJWT({
    isSuperAdmin: true,
    superAdminId: session.superAdminId,
    username: session.username,
    authSource: session.authSource,
    mustChangeCredentials: session.mustChangeCredentials,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSuperAdminSession(): Promise<SuperAdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key);
    const sessionPayload = payload as unknown as SuperAdminSessionPayload;
    if (sessionPayload.isSuperAdmin !== true) {
      return null;
    }
    return sessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSuperAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SUPER_ADMIN_COOKIE_NAME);
}

export async function requireSuperAdminSession(options?: {
  allowPendingCredentialChange?: boolean;
}): Promise<SuperAdminSessionPayload> {
  const session = await getSuperAdminSession();
  if (!session) {
    throw new Error("Super Admin Unauthorized");
  }

  if (session.mustChangeCredentials && !options?.allowPendingCredentialChange) {
    throw new Error("Super Admin Credentials Update Required");
  }

  return session;
}

export function buildSuperAdminLoginHistoryEntry(request: Request): LoginHistoryEntry {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return {
    loginAt: new Date().toISOString(),
    ipAddress,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}

export function recordPersistedSuperAdminLogin(
  superAdminId: string,
  loginEntry: LoginHistoryEntry
) {
  const db = getDb();
  const superAdmin = getPersistedSuperAdminById(superAdminId);
  if (!superAdmin) {
    return;
  }

  const updatedHistory = [loginEntry, ...(superAdmin.loginHistory ?? [])].slice(
    0,
    MAX_LOGIN_HISTORY
  );

  db.update(superAdmins)
    .set({
      lastLoginAt: loginEntry.loginAt,
      loginHistory: updatedHistory,
      updatedAt: loginEntry.loginAt,
    })
    .where(eq(superAdmins.id, superAdminId))
    .run();
}

export async function updateSuperAdminCredentials(
  session: SuperAdminSessionPayload,
  input: UpdateSuperAdminCredentialsInput
): Promise<SuperAdminRecord> {
  const db = getDb();
  const normalizedUsername = input.newUsername.trim();

  if (!normalizedUsername) {
    throw new Error("Username is required");
  }

  const existingWithUsername = getPersistedSuperAdminByUsername(normalizedUsername);
  const currentPersistedSuperAdmin = session.superAdminId
    ? getPersistedSuperAdminById(session.superAdminId)
    : getPrimaryPersistedSuperAdmin();

  if (
    existingWithUsername &&
    existingWithUsername.id !== currentPersistedSuperAdmin?.id
  ) {
    throw new Error("Username already exists");
  }

  if (session.authSource === "database") {
    if (!currentPersistedSuperAdmin) {
      throw new Error("Persisted super admin not found");
    }

    const currentPasswordValid = await verifyPassword(
      input.currentPassword,
      currentPersistedSuperAdmin.passwordHash
    );

    if (!currentPasswordValid) {
      throw new Error("Current password is incorrect");
    }
  } else {
    const environmentCredentials = getEnvironmentSuperAdminCredentials();
    if (!environmentCredentials) {
      throw new Error("Environment super admin credentials are not configured");
    }

    if (
      session.username !== environmentCredentials.username ||
      input.currentPassword !== environmentCredentials.password
    ) {
      throw new Error("Current password is incorrect");
    }
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.newPassword);

  if (currentPersistedSuperAdmin) {
    db.update(superAdmins)
      .set({
        username: normalizedUsername,
        passwordHash,
        mustChangeCredentials: false,
        usedDefaultCredentials: false,
        updatedAt: now,
      })
      .where(eq(superAdmins.id, currentPersistedSuperAdmin.id))
      .run();

    return getPersistedSuperAdminById(currentPersistedSuperAdmin.id)!;
  }

  db.insert(superAdmins)
    .values({
      username: normalizedUsername,
      passwordHash,
      mustChangeCredentials: false,
      usedDefaultCredentials: false,
      loginHistory: [],
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return getPersistedSuperAdminByUsername(normalizedUsername)!;
}

export function isSuperAdminConfigured(): boolean {
  return Boolean(getPrimaryPersistedSuperAdmin() || getEnvironmentSuperAdminCredentials());
}
