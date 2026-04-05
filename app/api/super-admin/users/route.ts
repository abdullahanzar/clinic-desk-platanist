import { NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireSuperAdminSession } from "@/lib/auth/super-admin";
import { getDb } from "@/lib/db/sqlite";
import { clinics, users, generateId } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

// GET /api/super-admin/users - List all users across all clinics
export async function GET(request: Request) {
  try {
    await requireSuperAdminSession();

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const isActive = searchParams.get("isActive");

    const db = getDb();

    // Build conditions
    const conditions = [];
    if (clinicId) {
      conditions.push(eq(users.clinicId, clinicId));
    }
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const userList = db
      .select({
        id: users.id,
        clinicId: users.clinicId,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .all();

    // Get clinic names
    const clinicIds = [...new Set(userList.map((u) => u.clinicId))];
    const clinicMap = new Map<string, string>();
    for (const cId of clinicIds) {
      const clinic = db
        .select({ name: clinics.name })
        .from(clinics)
        .where(eq(clinics.id, cId))
        .get();
      if (clinic) {
        clinicMap.set(cId, clinic.name);
      }
    }

    const formattedUsers = userList.map((user) => ({
      id: user.id,
      clinicId: user.clinicId,
      clinicName: clinicMap.get(user.clinicId) || "Unknown",
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

    const db = getDb();

    // Check if clinic exists
    const clinic = db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .get();
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check if email already exists
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = generateId();

    db.insert(users)
      .values({
        id: userId,
        clinicId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        isActive: true,
        loginHistory: [],
        createdAt: now,
        updatedAt: now,
      })
      .run();

    console.log(
      `[SUPER_ADMIN] Created user: ${email} (${role}) for clinic ${clinic.name}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
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
