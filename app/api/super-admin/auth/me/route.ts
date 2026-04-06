import { NextResponse } from "next/server";
import { getSuperAdminSession, isSuperAdminConfigured } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    if (!isSuperAdminConfigured()) {
      return NextResponse.json(
        { error: "Super admin access is unavailable" },
        { status: 503 }
      );
    }

    const session = await getSuperAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        username: session.username,
        authSource: session.authSource,
        mustChangeCredentials: session.mustChangeCredentials,
        canAccessDashboard: !session.mustChangeCredentials,
      },
    });
  } catch (error) {
    console.error("Super admin session check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
