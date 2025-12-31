import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getClinicsCollection } from "@/lib/db/collections";

// POST /api/shared-receipt/clear - Clear shared receipt
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinics = await getClinicsCollection();

    await clinics.updateOne(
      { _id: new ObjectId(session.clinicId) },
      {
        $set: {
          currentSharedReceiptId: null,
          currentSharedReceiptExpiresAt: null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear shared receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
