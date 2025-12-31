import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  seedDefaultMedications,
  hasDefaultMedications,
  getDefaultMedicationStats,
} from "@/lib/db/seed-medications";

// POST - Seed default medications for the clinic
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors can seed medications
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can seed default medications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const force = body.force === true;

    // Check if already seeded (unless force is true)
    if (!force) {
      const hasDefaults = await hasDefaultMedications(session.clinicId);
      if (hasDefaults) {
        const stats = await getDefaultMedicationStats(session.clinicId);
        return NextResponse.json({
          success: true,
          message: "Default medications already seeded",
          alreadySeeded: true,
          stats,
        });
      }
    }

    // Seed the medications
    const result = await seedDefaultMedications(
      session.clinicId,
      session.userId
    );

    const stats = await getDefaultMedicationStats(session.clinicId);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.allopathic} allopathic and ${result.homeopathic} homeopathic medications. ${result.skipped} already existed.`,
      seeded: result,
      stats,
    });
  } catch (error) {
    console.error("Error seeding default medications:", error);
    return NextResponse.json(
      { error: "Failed to seed default medications" },
      { status: 500 }
    );
  }
}

// GET - Check if default medications exist and get stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasDefaults = await hasDefaultMedications(session.clinicId);
    const stats = await getDefaultMedicationStats(session.clinicId);

    return NextResponse.json({
      hasDefaults,
      stats,
    });
  } catch (error) {
    console.error("Error checking default medications:", error);
    return NextResponse.json(
      { error: "Failed to check default medications" },
      { status: 500 }
    );
  }
}
