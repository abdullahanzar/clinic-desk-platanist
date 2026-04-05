import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { prescriptions, visits, generateId } from "@/lib/db/schema";

// GET /api/prescriptions - List prescriptions
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get("visitId");
    const limitParam = searchParams.get("limit");

    const db = getDb();
    const conditions = [eq(prescriptions.clinicId, session.clinicId)];

    if (visitId) {
      conditions.push(eq(prescriptions.visitId, visitId));
    }

    let query = db.select().from(prescriptions)
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt));

    const results = limitParam
      ? query.limit(parseInt(limitParam, 10)).all()
      : query.all();

    return NextResponse.json({
      prescriptions: results.map((p) => ({
        id: p.id,
        clinicId: p.clinicId,
        visitId: p.visitId,
        patientSnapshot: p.patientSnapshot,
        diagnosis: p.diagnosis,
        chiefComplaints: p.chiefComplaints,
        medications: p.medications,
        advice: p.advice,
        followUpDate: p.followUpDate,
        status: p.status,
        finalizedAt: p.finalizedAt,
        pdfGeneratedAt: p.pdfGeneratedAt,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get prescriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/prescriptions - Create prescription
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { visitId, diagnosis, chiefComplaints, medications, advice, followUpDate } = body;

    if (!visitId) {
      return NextResponse.json({ error: "Valid visit ID is required" }, { status: 400 });
    }

    const db = getDb();

    // Get visit to snapshot patient info
    const visit = db.select().from(visits)
      .where(and(eq(visits.id, visitId), eq(visits.clinicId, session.clinicId)))
      .get();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check if prescription already exists for this visit
    const existing = db.select({ id: prescriptions.id }).from(prescriptions)
      .where(eq(prescriptions.visitId, visitId))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Prescription already exists for this visit" },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    const meds = (medications || []).map((m: { name: string; dosage: string; duration: string; instructions?: string }) => ({
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      duration: m.duration.trim(),
      instructions: m.instructions?.trim(),
    }));

    db.insert(prescriptions).values({
      id,
      clinicId: session.clinicId,
      visitId,
      patientSnapshot: {
        name: visit.patientName,
        age: visit.patientAge ?? undefined,
        gender: visit.patientGender ?? undefined,
      },
      diagnosis: diagnosis?.trim() || null,
      chiefComplaints: chiefComplaints?.trim() || null,
      medications: meds,
      advice: advice?.trim() || null,
      followUpDate: followUpDate || null,
      status: "draft",
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    }).run();

    return NextResponse.json({
      success: true,
      prescription: {
        id,
        clinicId: session.clinicId,
        visitId,
        patientSnapshot: {
          name: visit.patientName,
          age: visit.patientAge ?? undefined,
          gender: visit.patientGender ?? undefined,
        },
        diagnosis: diagnosis?.trim() || null,
        chiefComplaints: chiefComplaints?.trim() || null,
        medications: meds,
        advice: advice?.trim() || null,
        followUpDate: followUpDate || null,
        status: "draft",
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Create prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
