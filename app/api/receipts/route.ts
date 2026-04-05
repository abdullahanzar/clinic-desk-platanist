import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, like } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts, generateId } from "@/lib/db/schema";
import { generateReceiptNumber } from "@/lib/utils/receipt-number";
import { startOfDay, endOfDay } from "@/lib/utils/date";

// GET /api/receipts - List receipts
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const limitParam = searchParams.get("limit");

    const db = getDb();
    const conditions = [eq(receipts.clinicId, session.clinicId)];

    if (dateParam) {
      const date = new Date(dateParam);
      conditions.push(gte(receipts.receiptDate, startOfDay(date).toISOString()));
      conditions.push(lte(receipts.receiptDate, endOfDay(date).toISOString()));
    }

    let query = db.select().from(receipts)
      .where(and(...conditions))
      .orderBy(desc(receipts.createdAt));

    const results = limitParam
      ? query.limit(parseInt(limitParam, 10)).all()
      : query.all();

    return NextResponse.json({
      receipts: results.map((r) => ({
        id: r.id,
        clinicId: r.clinicId,
        visitId: r.visitId ?? undefined,
        receiptNumber: r.receiptNumber,
        patientSnapshot: r.patientSnapshot,
        prescriptionSnapshot: r.prescriptionSnapshot ?? undefined,
        lineItems: r.lineItems,
        subtotal: r.subtotal,
        discountAmount: r.discountAmount,
        discountReason: r.discountReason ?? undefined,
        totalAmount: r.totalAmount,
        paymentMode: r.paymentMode ?? undefined,
        isPaid: r.isPaid,
        receiptDate: r.receiptDate,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        lastSharedAt: r.lastSharedAt ?? undefined,
      })),
    });
  } catch (error) {
    console.error("Get receipts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/receipts - Create receipt
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      visitId,
      patientName,
      patientPhone,
      lineItems,
      discountAmount = 0,
      discountReason,
      paymentMode,
      isPaid = false,
      prescriptionSnapshot,
    } = body;

    if (!patientName || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Patient name and at least one line item are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const year = new Date().getFullYear();

    // Get next receipt number
    const lastReceipt = db.select({ receiptNumber: receipts.receiptNumber })
      .from(receipts)
      .where(and(
        eq(receipts.clinicId, session.clinicId),
        like(receipts.receiptNumber, `RCP-${year}-%`),
      ))
      .orderBy(desc(receipts.receiptNumber))
      .limit(1)
      .get();

    let sequence = 1;
    if (lastReceipt) {
      const match = lastReceipt.receiptNumber.match(/RCP-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    const receiptNumber = generateReceiptNumber(year, sequence);

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );
    const totalAmount = Math.max(0, subtotal - (discountAmount || 0));

    const id = generateId();
    const now = new Date().toISOString();

    const items = lineItems.map((item: { description: string; amount: number }) => ({
      description: item.description.trim(),
      amount: item.amount,
    }));

    db.insert(receipts).values({
      id,
      clinicId: session.clinicId,
      visitId: visitId || null,
      receiptNumber,
      patientSnapshot: {
        name: patientName.trim(),
        phone: patientPhone?.trim(),
      },
      prescriptionSnapshot: prescriptionSnapshot ? {
        diagnosis: prescriptionSnapshot.diagnosis?.trim(),
        advice: prescriptionSnapshot.advice?.trim(),
      } : null,
      lineItems: items,
      subtotal,
      discountAmount: discountAmount || 0,
      discountReason: discountReason?.trim() || null,
      totalAmount,
      paymentMode: paymentMode || null,
      isPaid,
      receiptDate: now,
      createdBy: session.userId,
      createdAt: now,
    }).run();

    return NextResponse.json({
      success: true,
      receipt: {
        id,
        clinicId: session.clinicId,
        visitId: visitId || undefined,
        receiptNumber,
        patientSnapshot: { name: patientName.trim(), phone: patientPhone?.trim() },
        lineItems: items,
        subtotal,
        discountAmount: discountAmount || 0,
        totalAmount,
        paymentMode: paymentMode || undefined,
        isPaid,
        receiptDate: now,
        createdBy: session.userId,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
