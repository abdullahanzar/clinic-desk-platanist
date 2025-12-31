import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getPrescriptionsCollection, getVisitsCollection } from "@/lib/db/collections";

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid prescription ID" }, { status: 400 });
    }

    const prescriptions = await getPrescriptionsCollection();
    const visits = await getVisitsCollection();

    const prescription = await prescriptions.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    if (prescription.status === "finalized") {
      return NextResponse.json({ error: "Already finalized" }, { status: 400 });
    }

    // Finalize prescription
    await prescriptions.updateOne(
      { _id: prescription._id },
      {
        $set: {
          status: "finalized",
          finalizedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Mark visit as completed
    await visits.updateOne(
      { _id: prescription.visitId },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Finalize prescription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
