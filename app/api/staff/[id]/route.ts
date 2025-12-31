import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db/collections";
import { requireRole } from "@/lib/auth/session";

// GET /api/staff/[id] - Get single staff member details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["doctor"]);
    const clinicId = new ObjectId(session.clinicId);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(id), clinicId },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get creator name if exists
    let creatorName = null;
    if (user.createdByUserId) {
      const creator = await users.findOne(
        { _id: user.createdByUserId },
        { projection: { name: 1 } }
      );
      creatorName = creator?.name || null;
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        clinicId: user.clinicId.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        loginHistory: (user.loginHistory || []).map((entry) => ({
          loginAt: entry.loginAt.toISOString(),
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        })),
        createdByUserId: user.createdByUserId?.toString() || null,
        createdByName: creatorName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
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
    const clinicId = new ObjectId(session.clinicId);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, isActive } = body;

    const users = await getUsersCollection();

    // Check user exists and belongs to clinic
    const existingUser = await users.findOne({
      _id: new ObjectId(id),
      clinicId,
    });

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
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateFields.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      // Check email uniqueness if changing
      if (normalizedEmail !== existingUser.email) {
        const emailExists = await users.findOne({ email: normalizedEmail });
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

    await users.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

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
    const clinicId = new ObjectId(session.clinicId);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent deleting yourself
    if (id === session.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const users = await getUsersCollection();

    // Check user exists and belongs to clinic
    const existingUser = await users.findOne({
      _id: new ObjectId(id),
      clinicId,
    });

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

    await users.deleteOne({ _id: new ObjectId(id) });

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
