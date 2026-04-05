import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/sqlite";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import type { LoginHistoryEntry } from "@/types";

const MAX_LOGIN_HISTORY = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Extract IP and user agent for login history
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const now = new Date().toISOString();
    const loginEntry: LoginHistoryEntry = {
      loginAt: now,
      ipAddress,
      userAgent,
    };

    // Get existing login history (or empty array)
    const existingHistory: LoginHistoryEntry[] = user.loginHistory ?? [];
    
    // Add new entry and keep only last MAX_LOGIN_HISTORY entries
    const updatedHistory = [loginEntry, ...existingHistory].slice(0, MAX_LOGIN_HISTORY);

    // Update last login and login history
    db.update(users)
      .set({
        lastLoginAt: now,
        loginHistory: updatedHistory,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))
      .run();

    // Create session
    await createSession(
      user.id,
      user.clinicId,
      user.role as "doctor" | "frontdesk",
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
