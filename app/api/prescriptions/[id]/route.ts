import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getPrescriptionsCollection } from "@/lib/db/collections";

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid prescription ID" }, { status: 400 });
    }

    const prescriptions = await getPrescriptionsCollection();
    const prescription = await prescriptions.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({
      prescription: {
        ...prescription,
        _id: prescription._id.toString(),
        clinicId: prescription.clinicId.toString(),
        visitId: prescription.visitId.toString(),
        createdBy: prescription.createdBy.toString(),
      },
    });
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid prescription ID" }, { status: 400 });
    }

    const body = await request.json();
    const { diagnosis, chiefComplaints, medications, advice, followUpDate } = body;

    const prescriptions = await getPrescriptionsCollection();

    // Check if prescription exists and is not finalized
    const existing = await prescriptions.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

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
      updatedAt: new Date(),
    };

    if (diagnosis !== undefined) updateFields.diagnosis = diagnosis?.trim() || null;
    if (chiefComplaints !== undefined) updateFields.chiefComplaints = chiefComplaints?.trim() || null;
    if (advice !== undefined) updateFields.advice = advice?.trim() || null;
    if (followUpDate !== undefined) {
      updateFields.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }
    if (medications !== undefined) {
      updateFields.medications = medications.map((m: { name: string; dosage: string; duration: string; instructions?: string }) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions?.trim(),
      }));
    }

    const result = await prescriptions.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      prescription: {
        ...result,
        _id: result._id.toString(),
        clinicId: result.clinicId.toString(),
        visitId: result.visitId.toString(),
        createdBy: result.createdBy.toString(),
      },
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
