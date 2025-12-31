import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
import { generateReceiptNumber } from "@/lib/utils/receipt-number";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import type { ReceiptInsert } from "@/types";

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

    const receipts = await getReceiptsCollection();

    const query: Record<string, unknown> = {
      clinicId: new ObjectId(session.clinicId),
    };

    if (dateParam) {
      const date = new Date(dateParam);
      query.receiptDate = {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      };
    }

    let cursor = receipts.find(query).sort({ createdAt: -1 });

    if (limitParam) {
      cursor = cursor.limit(parseInt(limitParam, 10));
    }

    const results = await cursor.toArray();

    return NextResponse.json({
      receipts: results.map((r) => ({
        ...r,
        _id: r._id.toString(),
        clinicId: r.clinicId.toString(),
        visitId: r.visitId?.toString(),
        createdBy: r.createdBy.toString(),
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
    } = body;

    if (!patientName || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Patient name and at least one line item are required" },
        { status: 400 }
      );
    }

    const receipts = await getReceiptsCollection();
    const clinicId = new ObjectId(session.clinicId);
    const year = new Date().getFullYear();

    // Get next receipt number
    const lastReceipt = await receipts.findOne(
      { clinicId, receiptNumber: { $regex: `^RCP-${year}-` } },
      { sort: { receiptNumber: -1 } }
    );

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

    const receipt: ReceiptInsert = {
      clinicId,
      visitId: visitId ? new ObjectId(visitId) : undefined,
      receiptNumber,
      patientSnapshot: {
        name: patientName.trim(),
        phone: patientPhone?.trim(),
      },
      lineItems: lineItems.map((item: { description: string; amount: number }) => ({
        description: item.description.trim(),
        amount: item.amount,
      })),
      subtotal,
      discountAmount: discountAmount || 0,
      discountReason: discountReason?.trim(),
      totalAmount,
      paymentMode: paymentMode || undefined,
      isPaid,
      receiptDate: new Date(),
      createdBy: new ObjectId(session.userId),
      createdAt: new Date(),
    };

    const result = await receipts.insertOne(receipt as never);

    return NextResponse.json({
      success: true,
      receipt: {
        _id: result.insertedId.toString(),
        ...receipt,
        clinicId: receipt.clinicId.toString(),
        visitId: receipt.visitId?.toString(),
        createdBy: receipt.createdBy.toString(),
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
