import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { prescriptions } from "@/lib/db/schema";

// GET /api/prescriptions/[id] - Get single prescription
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const prescription = db.select().from(prescriptions)
      .where(and(eq(prescriptions.id, id), eq(prescriptions.clinicId, session.clinicId)))
      .get();

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Get prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/prescriptions/[id] - Update prescription
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { diagnosis, chiefComplaints, medications, advice, followUpDate } = body;

    const db = getDb();

    const existing = db.select().from(prescriptions)
      .where(and(eq(prescriptions.id, id), eq(prescriptions.clinicId, session.clinicId)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    if (existing.status === "finalized") {
      return NextResponse.json(
        { error: "Cannot edit finalized prescription" },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (diagnosis !== undefined) updateFields.diagnosis = diagnosis?.trim() || null;
    if (chiefComplaints !== undefined) updateFields.chiefComplaints = chiefComplaints?.trim() || null;
    if (advice !== undefined) updateFields.advice = advice?.trim() || null;
    if (followUpDate !== undefined) updateFields.followUpDate = followUpDate || null;
    if (medications !== undefined) {
      updateFields.medications = medications.map((m: { name: string; dosage: string; duration: string; instructions?: string }) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions?.trim(),
      }));
    }

    db.update(prescriptions)
      .set(updateFields)
      .where(eq(prescriptions.id, id))
      .run();

    const result = db.select().from(prescriptions)
      .where(eq(prescriptions.id, id))
      .get();

    if (!result) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      prescription: result,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
