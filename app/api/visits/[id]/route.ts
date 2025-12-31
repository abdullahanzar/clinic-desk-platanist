import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getVisitsCollection, getPrescriptionsCollection, getReceiptsCollection } from "@/lib/db/collections";

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid visit ID" }, { status: 400 });
    }

    const visits = await getVisitsCollection();
    const visit = await visits.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({
      visit: {
        ...visit,
        _id: visit._id.toString(),
        clinicId: visit.clinicId.toString(),
        createdBy: visit.createdBy.toString(),
        consultedBy: visit.consultedBy?.toString(),
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid visit ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, patientName, phone, age, gender, visitReason } = body;

    const visits = await getVisitsCollection();

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateFields.status = status;
      if (status === "in-consultation") {
        updateFields.consultedBy = new ObjectId(session.userId);
      }
      if (status === "completed") {
        updateFields.completedAt = new Date();
      }
    }

    if (patientName || phone || age !== undefined || gender) {
      const patientUpdate: Record<string, unknown> = {};
      if (patientName) patientUpdate["patient.name"] = patientName.trim();
      if (phone) patientUpdate["patient.phone"] = phone.trim();
      if (age !== undefined) patientUpdate["patient.age"] = age ? parseInt(age, 10) : null;
      if (gender) patientUpdate["patient.gender"] = gender;
      Object.assign(updateFields, patientUpdate);
    }

    if (visitReason) {
      updateFields.visitReason = visitReason.trim();
    }

    const result = await visits.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        clinicId: new ObjectId(session.clinicId),
      },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      visit: {
        ...result,
        _id: result._id.toString(),
        clinicId: result.clinicId.toString(),
        createdBy: result.createdBy.toString(),
        consultedBy: result.consultedBy?.toString(),
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

    // Only doctors can delete visits
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can delete visits" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid visit ID" }, { status: 400 });
    }

    const visitId = new ObjectId(id);
    const clinicId = new ObjectId(session.clinicId);

    const visits = await getVisitsCollection();
    const prescriptions = await getPrescriptionsCollection();
    const receipts = await getReceiptsCollection();

    // Check if visit exists
    const visit = await visits.findOne({ _id: visitId, clinicId });
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Delete related prescriptions
    await prescriptions.deleteMany({ visitId, clinicId });

    // Delete related receipts
    await receipts.deleteMany({ visitId, clinicId });

    // Delete the visit
    await visits.deleteOne({ _id: visitId, clinicId });

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
