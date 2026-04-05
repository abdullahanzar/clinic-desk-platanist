import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";
import { users, generateId } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET /api/staff - List all staff members for the clinic
export async function GET() {
  try {
    const session = await requireRole(["doctor"]);
    const db = getDb();

    const staff = await db
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
      .where(eq(users.clinicId, session.clinicId))
      .orderBy(users.role, users.name)
      .all();

    const staffList = staff.map((user) => ({
      id: user.id,
      clinicId: user.clinicId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || null,
      loginCount: (user.loginHistory as unknown[])?.length || 0,
      createdByUserId: user.createdByUserId || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
    const db = getDb();

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

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const now = new Date().toISOString();
    const newId = generateId();

    await db.insert(users).values({
      id: newId,
      clinicId: session.clinicId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      role: "frontdesk",
      isActive: true,
      loginHistory: [],
      createdByUserId: session.userId,
      createdAt: now,
      updatedAt: now,
    }).run();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role: "frontdesk",
          isActive: true,
          createdAt: now,
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
