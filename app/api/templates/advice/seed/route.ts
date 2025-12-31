import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  seedDefaultAdvice,
  hasDefaultAdvice,
  getDefaultAdviceStats,
} from "@/lib/db/seed-advice";

// POST - Seed default advice for the clinic
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors can seed advice
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can seed default advice" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const force = body.force === true;

    // Check if already seeded (unless force is true)
    if (!force) {
      const hasDefaults = await hasDefaultAdvice(session.clinicId);
      if (hasDefaults) {
        const stats = await getDefaultAdviceStats(session.clinicId);
        return NextResponse.json({
          success: true,
          message: "Default advice already seeded",
          alreadySeeded: true,
          stats,
        });
      }
    }

    // Seed the advice
    const result = await seedDefaultAdvice(
      session.clinicId,
      session.userId
    );

    const stats = await getDefaultAdviceStats(session.clinicId);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.added} advice templates. ${result.skipped} already existed.`,
      seeded: result,
      stats,
    });
  } catch (error) {
    console.error("Error seeding default advice:", error);
    return NextResponse.json(
      { error: "Failed to seed default advice" },
      { status: 500 }
    );
  }
}

// GET - Check if default advice exists and get stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasDefaults = await hasDefaultAdvice(session.clinicId);
    const stats = await getDefaultAdviceStats(session.clinicId);

    return NextResponse.json({
      hasDefaults,
      stats,
    });
  } catch (error) {
    console.error("Error checking default advice:", error);
    return NextResponse.json(
      { error: "Failed to check default advice" },
      { status: 500 }
    );
  }
}
