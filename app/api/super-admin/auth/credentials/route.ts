import { NextResponse } from "next/server";
import {
  createSuperAdminSession,
  requireSuperAdminSession,
  updateSuperAdminCredentials,
} from "@/lib/auth/super-admin";

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdminSession({
      allowPendingCredentialChange: true,
    });

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword || !newUsername || !newPassword) {
      return NextResponse.json(
        { error: "Current password, new username, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const updatedSuperAdmin = await updateSuperAdminCredentials(session, {
      currentPassword,
      newUsername,
      newPassword,
    });

    await createSuperAdminSession({
      superAdminId: updatedSuperAdmin.id,
      username: updatedSuperAdmin.username,
      authSource: "database",
      mustChangeCredentials: false,
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    const message = (error as Error).message;

    if (message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (message === "Current password is incorrect") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === "Username already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (
      message === "Persisted super admin not found" ||
      message === "Environment super admin credentials are not configured" ||
      message === "Username is required"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Super admin credential update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}