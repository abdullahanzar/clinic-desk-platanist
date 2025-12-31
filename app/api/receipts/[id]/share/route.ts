import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";

// POST /api/receipts/[id]/share - Share receipt to desk QR
export async function POST(
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
    const clinics = await getClinicsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Verify receipt belongs to clinic
    const receipt = await receipts.findOne({
      _id: new ObjectId(id),
      clinicId,
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Get clinic to get share duration
    const clinic = await clinics.findOne({ _id: clinicId });
    const shareDuration = clinic?.receiptShareDurationMinutes || 10;

    const expiresAt = new Date(Date.now() + shareDuration * 60 * 1000);

    // Update clinic with shared receipt
    await clinics.updateOne(
      { _id: clinicId },
      {
        $set: {
          currentSharedReceiptId: receipt._id,
          currentSharedReceiptExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    // Update receipt's lastSharedAt
    await receipts.updateOne(
      { _id: receipt._id },
      { $set: { lastSharedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      shareDurationMinutes: shareDuration,
    });
  } catch (error) {
    console.error("Share receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
