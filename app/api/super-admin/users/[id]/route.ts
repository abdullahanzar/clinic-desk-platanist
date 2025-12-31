import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getUsersCollection, getClinicsCollection } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";

// GET /api/super-admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminSession();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const users = await getUsersCollection();
    const clinics = await getClinicsCollection();

    const user = await users.findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const clinic = await clinics.findOne({ _id: user.clinicId });

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        clinicId: user.clinicId.toString(),
        clinicName: clinic?.name || "Unknown",
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        loginHistory: user.loginHistory?.slice(0, 10) || [], // Last 10 logins
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const users = await getUsersCollection();

    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
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

      const existingUser = await users.findOne({
        email: body.email.toLowerCase(),
        _id: { $ne: new ObjectId(id) },
      });
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

    await users.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const users = await getUsersCollection();

    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await users.deleteOne({ _id: new ObjectId(id) });

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
