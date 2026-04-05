import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { clinics } from "@/lib/db/schema";

// POST /api/shared-receipt/clear - Clear shared receipt
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    db.update(clinics)
      .set({
        currentSharedReceiptId: null,
        currentSharedReceiptExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clinics.id, session.clinicId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear shared receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
