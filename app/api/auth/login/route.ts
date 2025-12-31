import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db/collections";
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

    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.toLowerCase() });

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

    const now = new Date();
    const loginEntry: LoginHistoryEntry = {
      loginAt: now,
      ipAddress,
      userAgent,
    };

    // Get existing login history (or empty array)
    const existingHistory = user.loginHistory || [];
    
    // Add new entry and keep only last MAX_LOGIN_HISTORY entries
    const updatedHistory = [loginEntry, ...existingHistory].slice(0, MAX_LOGIN_HISTORY);

    // Update last login and login history
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLoginAt: now,
          loginHistory: updatedHistory,
        } 
      }
    );

    // Create session
    await createSession(
      user._id.toString(),
      user.clinicId.toString(),
      user.role
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
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
