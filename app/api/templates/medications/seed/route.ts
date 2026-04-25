import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  seedDefaultMedications,
  hasDefaultMedications,
  getDefaultMedicationStats,
  clearDefaultMedications,
} from "@/lib/db/seed-medications";

const DEFAULT_SOURCES = ["allopathic", "homeopathic"] as const;

type DefaultMedicationSource = (typeof DEFAULT_SOURCES)[number];

function getSelectedSources(body: unknown): DefaultMedicationSource[] {
  const requestedSources = Array.isArray((body as { sources?: unknown })?.sources)
    ? (body as { sources: unknown[] }).sources
    : typeof (body as { source?: unknown })?.source === "string"
      ? [(body as { source: unknown }).source]
      : [];

  if (requestedSources.length === 0) {
    return [...DEFAULT_SOURCES];
  }

  const validSources = requestedSources.filter(
    (source): source is DefaultMedicationSource =>
      typeof source === "string" &&
      DEFAULT_SOURCES.includes(source as DefaultMedicationSource)
  );

  if (validSources.length !== requestedSources.length) {
    throw new Error("Invalid medication source selection");
  }

  return Array.from(new Set(validSources));
}

function buildSeedMessage(
  result: { allopathic: number; homeopathic: number; skipped: number },
  sources: DefaultMedicationSource[]
) {
  const loaded: string[] = [];

  if (sources.includes("allopathic")) {
    loaded.push(`${result.allopathic} allopathic`);
  }

  if (sources.includes("homeopathic")) {
    loaded.push(`${result.homeopathic} homeopathic`);
  }

  return `Loaded ${loaded.join(" and ")} medications. ${result.skipped} already existed.`;
}

function buildClearMessage(
  result: { allopathic: number; homeopathic: number; total: number },
  sources: DefaultMedicationSource[]
) {
  const cleared: string[] = [];

  if (sources.includes("allopathic")) {
    cleared.push(`${result.allopathic} allopathic`);
  }

  if (sources.includes("homeopathic")) {
    cleared.push(`${result.homeopathic} homeopathic`);
  }

  return `Cleared ${cleared.join(" and ")} medications.`;
}

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

    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    let sources: DefaultMedicationSource[];
    try {
      sources = getSelectedSources(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid medication source selection" },
        { status: 400 }
      );
    }

    // Seed the medications
    const result = await seedDefaultMedications(
      session.clinicId,
      session.userId,
      sources
    );

    const stats = await getDefaultMedicationStats(session.clinicId);
    const seededTotal = result.allopathic + result.homeopathic;

    return NextResponse.json({
      success: true,
      message: buildSeedMessage(result, sources),
      alreadySeeded: !force && seededTotal === 0 && result.skipped > 0,
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

// DELETE - Clear loaded default medications for the clinic
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can clear default medications" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    let sources: DefaultMedicationSource[];
    try {
      sources = getSelectedSources(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid medication source selection" },
        { status: 400 }
      );
    }

    const deleted = await clearDefaultMedications(session.clinicId, sources);
    const stats = await getDefaultMedicationStats(session.clinicId);

    return NextResponse.json({
      success: true,
      message: buildClearMessage(deleted, sources),
      deleted,
      stats,
    });
  } catch (error) {
    console.error("Error clearing default medications:", error);
    return NextResponse.json(
      { error: "Failed to clear default medications" },
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
