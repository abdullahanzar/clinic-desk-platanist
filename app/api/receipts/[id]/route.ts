import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts } from "@/lib/db/schema";

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
    const db = getDb();

    const receipt = db.select().from(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.clinicId, session.clinicId)))
      .get();

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({ receipt });
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

    if (session.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can delete receipts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getDb();

    const existing = db.select({ id: receipts.id }).from(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.clinicId, session.clinicId)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    db.delete(receipts)
      .where(and(eq(receipts.id, id), eq(receipts.clinicId, session.clinicId)))
      .run();

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
