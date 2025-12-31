import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getPrescriptionsCollection, getVisitsCollection } from "@/lib/db/collections";
import type { PrescriptionInsert } from "@/types";

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

    const prescriptions = await getPrescriptionsCollection();

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
    };

    if (visitId && ObjectId.isValid(visitId)) {
      query.visitId = new ObjectId(visitId);
    }

    let cursor = prescriptions.find(query).sort({ createdAt: -1 });

    if (limitParam) {
      cursor = cursor.limit(parseInt(limitParam, 10));
    }

    const results = await cursor.toArray();

    return NextResponse.json({
      prescriptions: results.map((p) => ({
        ...p,
        _id: p._id.toString(),
        clinicId: p.clinicId.toString(),
        visitId: p.visitId.toString(),
        createdBy: p.createdBy.toString(),
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

    // Only doctors can create prescriptions
    if (session.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { visitId, diagnosis, chiefComplaints, medications, advice, followUpDate } = body;

    if (!visitId || !ObjectId.isValid(visitId)) {
      return NextResponse.json({ error: "Valid visit ID is required" }, { status: 400 });
    }

    const visits = await getVisitsCollection();
    const prescriptions = await getPrescriptionsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Get visit to snapshot patient info
    const visit = await visits.findOne({
      _id: new ObjectId(visitId),
      clinicId,
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check if prescription already exists for this visit
    const existing = await prescriptions.findOne({ visitId: new ObjectId(visitId) });
    if (existing) {
      return NextResponse.json(
        { error: "Prescription already exists for this visit" },
        { status: 400 }
      );
    }

    const prescription: PrescriptionInsert = {
      clinicId,
      visitId: new ObjectId(visitId),
      patientSnapshot: {
        name: visit.patient.name,
        age: visit.patient.age,
        gender: visit.patient.gender,
      },
      diagnosis: diagnosis?.trim(),
      chiefComplaints: chiefComplaints?.trim(),
      medications: (medications || []).map((m: { name: string; dosage: string; duration: string; instructions?: string }) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions?.trim(),
      })),
      advice: advice?.trim(),
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      status: "draft",
      createdBy: new ObjectId(session.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await prescriptions.insertOne(prescription as never);

    return NextResponse.json({
      success: true,
      prescription: {
        _id: result.insertedId.toString(),
        ...prescription,
        clinicId: prescription.clinicId.toString(),
        visitId: prescription.visitId.toString(),
        createdBy: prescription.createdBy.toString(),
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
