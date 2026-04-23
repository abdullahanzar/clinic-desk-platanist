import { NextResponse } from "next/server";
import {
  validateSuperAdminCredentials,
  createSuperAdminSession,
  buildSuperAdminLoginHistoryEntry,
  isSuperAdminConfigured,
  recordPersistedSuperAdminLogin,
} from "@/lib/auth/super-admin";

export async function POST(request: Request) {
  try {
    if (!isSuperAdminConfigured()) {
      return NextResponse.json(
        { error: "Super admin access is unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await validateSuperAdminCredentials(username, password);

    if (!result.authenticated || !result.authSource || !result.username) {
      console.warn(
        `[SUPER_ADMIN] Failed login attempt from IP: ${
          request.headers.get("x-forwarded-for") || "unknown"
        }`
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (result.authSource === "database" && result.superAdmin?.id) {
      recordPersistedSuperAdminLogin(
        result.superAdmin.id,
        buildSuperAdminLoginHistoryEntry(request)
      );
    }

    await createSuperAdminSession({
      superAdminId: result.superAdmin?.id,
      username: result.username,
      authSource: result.authSource,
      mustChangeCredentials: Boolean(result.mustChangeCredentials),
    }, request);

    console.log(
      `[SUPER_ADMIN] Successful login from IP: ${
        request.headers.get("x-forwarded-for") || "unknown"
      }`
    );

    return NextResponse.json({
      success: true,
      mustChangeCredentials: Boolean(result.mustChangeCredentials),
      redirectTo: result.mustChangeCredentials
        ? "/admin/change-credentials"
        : "/admin/dashboard",
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
