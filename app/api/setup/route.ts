import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";

// POST /api/setup - One-time setup endpoint
export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Setup not allowed in production" },
        { status: 403 }
      );
    }

    const result = await seedDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed", details: String(error) },
      { status: 500 }
    );
  }
}
