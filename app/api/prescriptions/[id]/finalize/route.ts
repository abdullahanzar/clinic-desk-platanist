import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { prescriptions, visits } from "@/lib/db/schema";

// POST /api/prescriptions/[id]/finalize - Finalize prescription
export async function POST(
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
    const db = getDb();

    const prescription = db.select().from(prescriptions)
      .where(and(eq(prescriptions.id, id), eq(prescriptions.clinicId, session.clinicId)))
      .get();

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    if (prescription.status === "finalized") {
      return NextResponse.json({ error: "Already finalized" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Finalize prescription
    db.update(prescriptions)
      .set({ status: "finalized", finalizedAt: now, updatedAt: now })
      .where(eq(prescriptions.id, id))
      .run();

    // Mark visit as completed
    db.update(visits)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(visits.id, prescription.visitId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Finalize prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
