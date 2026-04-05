import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts, clinics } from "@/lib/db/schema";

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
    const db = getDb();

    // Verify receipt belongs to clinic
    const receipt = db.select().from(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.clinicId, session.clinicId)))
      .get();

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Get clinic to get share duration
    const clinic = db.select().from(clinics).where(eq(clinics.id, session.clinicId)).get();

    const shareDuration = clinic?.receiptShareDurationMinutes || 10;
    const expiresAt = new Date(Date.now() + shareDuration * 60 * 1000);
    const now = new Date().toISOString();

    // Update clinic with shared receipt
    db.update(clinics)
      .set({
        currentSharedReceiptId: receipt.id,
        currentSharedReceiptExpiresAt: expiresAt.toISOString(),
        updatedAt: now,
      })
      .where(eq(clinics.id, session.clinicId))
      .run();

    // Update receipt's lastSharedAt
    db.update(receipts)
      .set({ lastSharedAt: now })
      .where(eq(receipts.id, receipt.id))
      .run();

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
