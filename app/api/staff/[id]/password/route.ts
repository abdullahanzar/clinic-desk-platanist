import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// PUT /api/staff/[id]/password - Reset staff member's password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["doctor"]);
    const { id } = await params;
    const db = getDb();

    const body = await request.json();
    const { password } = body;

    // Validation
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check user exists and belongs to clinic
    const existingUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, id), eq(users.clinicId, session.clinicId)))
      .get();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent doctors from resetting other doctor's passwords via this route
    if (existingUser.role === "doctor" && id !== session.userId) {
      return NextResponse.json(
        { error: "Cannot reset another doctor's password" },
        { status: 403 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
