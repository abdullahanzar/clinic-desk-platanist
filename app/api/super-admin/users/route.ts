import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getUsersCollection, getClinicsCollection } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth/password";
import type { UserInsert } from "@/types";

// GET /api/super-admin/users - List all users across all clinics
export async function GET(request: Request) {
  try {
    await requireSuperAdminSession();

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const isActive = searchParams.get("isActive");

    const users = await getUsersCollection();
    const clinics = await getClinicsCollection();

    // Build query
    const query: Record<string, unknown> = {};
    if (clinicId && ObjectId.isValid(clinicId)) {
      query.clinicId = new ObjectId(clinicId);
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const userList = await users
      .find(query, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    // Get clinic names
    const clinicIds = [...new Set(userList.map((u) => u.clinicId.toString()))];
    const clinicList = await clinics
      .find({ _id: { $in: clinicIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const clinicMap = new Map(
      clinicList.map((c) => [c._id.toString(), c.name])
    );

    const formattedUsers = userList.map((user) => ({
      _id: user._id.toString(),
      clinicId: user.clinicId.toString(),
      clinicName: clinicMap.get(user.clinicId.toString()) || "Unknown",
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin users list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/users - Create a new user
export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();

    const body = await request.json();
    const { clinicId, name, email, password, role } = body;

    // Validate required fields
    if (!clinicId || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Required fields: clinicId, name, email, password, role" },
        { status: 400 }
      );
    }

    // Validate clinic ID
    if (!ObjectId.isValid(clinicId)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    // Validate role
    if (!["doctor", "frontdesk"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'doctor' or 'frontdesk'" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const clinics = await getClinicsCollection();
    const users = await getUsersCollection();

    // Check if clinic exists
    const clinic = await clinics.findOne({ _id: new ObjectId(clinicId) });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check if email already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user: UserInsert = {
      clinicId: new ObjectId(clinicId),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      isActive: true,
      loginHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(user as never);

    console.log(
      `[SUPER_ADMIN] Created user: ${email} (${role}) for clinic ${clinic.name}`
    );

    return NextResponse.json({
      success: true,
      user: {
        _id: result.insertedId.toString(),
        name,
        email: email.toLowerCase(),
        role,
      },
    });
  } catch (error) {
    if ((error as Error).message === "Super Admin Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Super admin create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
