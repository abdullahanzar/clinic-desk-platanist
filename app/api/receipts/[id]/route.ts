import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection } from "@/lib/db/collections";

// GET /api/receipts/[id] - Get single receipt
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
      return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 });
    }

    const receipts = await getReceiptsCollection();
    const receipt = await receipts.findOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({
      receipt: {
        ...receipt,
        _id: receipt._id.toString(),
        clinicId: receipt.clinicId.toString(),
        visitId: receipt.visitId?.toString(),
        createdBy: receipt.createdBy.toString(),
      },
    });
  } catch (error) {
    console.error("Get receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/receipts/[id] - Delete receipt (doctor only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors can delete receipts
    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can delete receipts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 });
    }

    const receipts = await getReceiptsCollection();
    const result = await receipts.deleteOne({
      _id: new ObjectId(id),
      clinicId: new ObjectId(session.clinicId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Delete receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
