import { NextResponse } from "next/server";
import {
  validateSuperAdminCredentials,
  createSuperAdminSession,
  isSuperAdminConfigured,
} from "@/lib/auth/super-admin";

export async function POST(request: Request) {
  try {
    // Check if super admin is configured
    if (!isSuperAdminConfigured()) {
      return NextResponse.json(
        { error: "Super admin not configured" },
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

    const isValid = validateSuperAdminCredentials(username, password);

    if (!isValid) {
      // Log failed attempt (but don't expose details)
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

    // Create session
    await createSuperAdminSession();

    // Log successful login
    console.log(
      `[SUPER_ADMIN] Successful login from IP: ${
        request.headers.get("x-forwarded-for") || "unknown"
      }`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
