import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";

// GET /api/staff/[id] - Get single staff member details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["doctor"]);
    const { id } = await params;
    const db = getDb();

    const user = await db
      .select({
        id: users.id,
        clinicId: users.clinicId,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        loginHistory: users.loginHistory,
        createdByUserId: users.createdByUserId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.clinicId, session.clinicId)))
      .get();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get creator name if exists
    let creatorName = null;
    if (user.createdByUserId) {
      const creator = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, user.createdByUserId))
        .get();
      creatorName = creator?.name || null;
    }

    const loginHistory = (user.loginHistory || []) as Array<{
      loginAt: string;
      ipAddress?: string;
      userAgent?: string;
    }>;

    return NextResponse.json({
      user: {
        id: user.id,
        clinicId: user.clinicId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt || null,
        loginHistory: loginHistory.map((entry) => ({
          loginAt: entry.loginAt,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        })),
        createdByUserId: user.createdByUserId || null,
        createdByName: creatorName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
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

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["doctor"]);
    const { id } = await params;
    const db = getDb();

    const body = await request.json();
    const { name, email, isActive } = body;

    // Check user exists and belongs to clinic
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.id, id), eq(users.clinicId, session.clinicId)))
      .get();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating yourself
    if (id === session.userId && isActive === false) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateFields.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      // Check email uniqueness if changing
      if (normalizedEmail !== existingUser.email) {
        const emailExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .get();
        if (emailExists) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 }
          );
        }
      }
      updateFields.email = normalizedEmail;
    }

    if (isActive !== undefined) {
      updateFields.isActive = Boolean(isActive);
    }

    await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating staff member:", error);
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

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["doctor"]);
    const { id } = await params;
    const db = getDb();

    // Prevent deleting yourself
    if (id === session.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
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

    // Prevent deleting doctors
    if (existingUser.role === "doctor") {
      return NextResponse.json(
        { error: "Cannot delete doctor accounts" },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff member:", error);
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
