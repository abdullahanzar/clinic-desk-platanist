import { NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getDb } from "@/lib/db/sqlite";
import { clinics, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

// GET /api/super-admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    const db = getDb();

    const user = db
      .select({
        id: users.id,
        clinicId: users.clinicId,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        loginHistory: users.loginHistory,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const clinic = db
      .select({ name: clinics.name })
      .from(clinics)
      .where(eq(clinics.id, user.clinicId))
      .get();

    return NextResponse.json({
      user: {
        id: user.id,
        clinicId: user.clinicId,
        clinicName: clinic?.name || "Unknown",
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        loginHistory: (user.loginHistory || []).slice(0, 10), // Last 10 logins
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;
    const body = await request.json();

    const db = getDb();

    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Update name
    if (body.name) {
      updateFields.name = body.name;
    }

    // Update role
    if (body.role && ["doctor", "frontdesk"].includes(body.role)) {
      updateFields.role = body.role;
    }

    // Update active status (for revocation)
    if (typeof body.isActive === "boolean") {
      updateFields.isActive = body.isActive;
      if (!body.isActive) {
        console.log(`[SUPER_ADMIN] Revoked user: ${user.email} (${id})`);
      } else {
        console.log(`[SUPER_ADMIN] Reactivated user: ${user.email} (${id})`);
      }
    }

    // Update email (with uniqueness check)
    if (body.email && body.email.toLowerCase() !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      const existingUser = db
        .select()
        .from(users)
        .where(and(eq(users.email, body.email.toLowerCase()), ne(users.id, id)))
        .get();
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      updateFields.email = body.email.toLowerCase();
    }

    // Update password
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateFields.passwordHash = await hashPassword(body.password);
      console.log(`[SUPER_ADMIN] Reset password for user: ${user.email} (${id})`);
    }

    db.update(users).set(updateFields).where(eq(users.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    const db = getDb();

    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    db.delete(users).where(eq(users.id, id)).run();

    console.log(`[SUPER_ADMIN] Deleted user: ${user.email} (${id})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
