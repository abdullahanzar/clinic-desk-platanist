import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db/collections";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import type { UserInsert } from "@/types";

// GET /api/staff - List all staff members for the clinic
export async function GET() {
  try {
    const session = await requireRole(["doctor"]);
    const clinicId = new ObjectId(session.clinicId);

    const users = await getUsersCollection();
    const staff = await users
      .find(
        { clinicId },
        {
          projection: {
            passwordHash: 0, // Never return password hash
          },
        }
      )
      .sort({ role: 1, name: 1 }) // Doctors first, then alphabetically
      .toArray();

    // Transform ObjectIds to strings for JSON response
    const staffList = staff.map((user) => ({
      id: user._id.toString(),
      clinicId: user.clinicId.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      loginCount: user.loginHistory?.length || 0,
      createdByUserId: user.createdByUserId?.toString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json({ staff: staffList });
  } catch (error) {
    console.error("Error fetching staff:", error);
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

// POST /api/staff - Create a new staff member
export async function POST(request: Request) {
  try {
    const session = await requireRole(["doctor"]);
    const clinicId = new ObjectId(session.clinicId);
    const creatorId = new ObjectId(session.userId);

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Only allow creating frontdesk users (doctors can't create other doctors)
    if (role && role !== "frontdesk") {
      return NextResponse.json(
        { error: "Can only create frontdesk users" },
        { status: 400 }
      );
    }

    const users = await getUsersCollection();

    // Check if email already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const newUser: UserInsert = {
      clinicId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "frontdesk" as const,
      isActive: true,
      loginHistory: [],
      createdByUserId: creatorId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(newUser as never);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.insertedId.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating staff:", error);
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
