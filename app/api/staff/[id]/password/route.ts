import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db/collections";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// PUT /api/staff/[id]/password - Reset staff member's password
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

    const users = await getUsersCollection();

    // Check user exists and belongs to clinic
    const existingUser = await users.findOne({
      _id: new ObjectId(id),
      clinicId,
    });

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
    const passwordHash = await hashPassword(password);

    await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
      }
    );

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
