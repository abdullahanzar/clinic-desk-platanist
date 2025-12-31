import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  seedDefaultDiagnoses,
  getDefaultDiagnosesStats,
} from "@/lib/db/seed-diagnoses";

// POST - Seed default diagnoses for the clinic
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can seed default diagnoses" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const result = await seedDefaultDiagnoses(
      session.clinicId,
      session.userId,
      force
    );

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.inserted > 0
          ? `Successfully added ${result.inserted} default diagnoses`
          : "Default diagnoses already loaded",
    });
  } catch (error) {
    console.error("Error seeding default diagnoses:", error);
    return NextResponse.json(
      { error: "Failed to seed default diagnoses" },
      { status: 500 }
    );
  }
}

// GET - Check if default diagnoses exist and get stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getDefaultDiagnosesStats(session.clinicId);

    return NextResponse.json({
      hasDefaults: stats.default > 0,
      stats,
    });
  } catch (error) {
    console.error("Error checking default diagnoses:", error);
    return NextResponse.json(
      { error: "Failed to check default diagnoses" },
      { status: 500 }
    );
  }
}
