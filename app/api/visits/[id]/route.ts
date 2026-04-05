import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { visits, prescriptions, receipts } from "@/lib/db/schema";

// GET /api/visits/[id] - Get single visit
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

    const visit = db.select().from(visits)
      .where(and(eq(visits.id, id), eq(visits.clinicId, session.clinicId)))
      .get();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({
      visit: {
        id: visit.id,
        clinicId: visit.clinicId,
        patient: {
          name: visit.patientName,
          phone: visit.patientPhone,
          age: visit.patientAge ?? undefined,
          gender: visit.patientGender ?? undefined,
        },
        visitReason: visit.visitReason,
        visitDate: visit.visitDate,
        tokenNumber: visit.tokenNumber,
        status: visit.status,
        createdBy: visit.createdBy,
        consultedBy: visit.consultedBy ?? undefined,
        createdAt: visit.createdAt,
        updatedAt: visit.updatedAt,
        completedAt: visit.completedAt ?? undefined,
      },
    });
  } catch (error) {
    console.error("Get visit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/visits/[id] - Update visit
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, patientName, phone, age, gender, visitReason } = body;

    const db = getDb();
    const now = new Date().toISOString();

    const updateFields: Record<string, unknown> = {
      updatedAt: now,
    };

    if (status) {
      updateFields.status = status;
      if (status === "in-consultation") {
        updateFields.consultedBy = session.userId;
      }
      if (status === "completed") {
        updateFields.completedAt = now;
      }
    }

    if (patientName) updateFields.patientName = patientName.trim();
    if (phone) updateFields.patientPhone = phone.trim();
    if (age !== undefined) updateFields.patientAge = age ? parseInt(age, 10) : null;
    if (gender) updateFields.patientGender = gender;
    if (visitReason) updateFields.visitReason = visitReason.trim();

    db.update(visits)
      .set(updateFields)
      .where(and(eq(visits.id, id), eq(visits.clinicId, session.clinicId)))
      .run();

    const result = db.select().from(visits)
      .where(and(eq(visits.id, id), eq(visits.clinicId, session.clinicId)))
      .get();

    if (!result) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      visit: {
        id: result.id,
        clinicId: result.clinicId,
        patient: {
          name: result.patientName,
          phone: result.patientPhone,
          age: result.patientAge ?? undefined,
          gender: result.patientGender ?? undefined,
        },
        visitReason: result.visitReason,
        visitDate: result.visitDate,
        tokenNumber: result.tokenNumber,
        status: result.status,
        createdBy: result.createdBy,
        consultedBy: result.consultedBy ?? undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        completedAt: result.completedAt ?? undefined,
      },
    });
  } catch (error) {
    console.error("Update visit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/visits/[id] - Delete visit and related data (doctor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can delete visits" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getDb();

    const visit = db.select().from(visits)
      .where(and(eq(visits.id, id), eq(visits.clinicId, session.clinicId)))
      .get();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Delete related prescriptions and receipts, then the visit
    db.delete(prescriptions)
      .where(and(eq(prescriptions.visitId, id), eq(prescriptions.clinicId, session.clinicId)))
      .run();
    db.delete(receipts)
      .where(and(eq(receipts.visitId, id), eq(receipts.clinicId, session.clinicId)))
      .run();
    db.delete(visits)
      .where(and(eq(visits.id, id), eq(visits.clinicId, session.clinicId)))
      .run();

    return NextResponse.json({
      success: true,
      message: "Visit and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete visit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
