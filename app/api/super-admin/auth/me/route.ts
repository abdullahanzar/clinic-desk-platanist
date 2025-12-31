import { NextResponse } from "next/server";
import { getSuperAdminSession, isSuperAdminConfigured } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    if (!isSuperAdminConfigured()) {
      return NextResponse.json(
        { error: "Super admin not configured" },
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

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Super admin session check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
