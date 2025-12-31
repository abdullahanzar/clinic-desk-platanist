import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection } from "@/lib/db/collections";

// GET /api/billing/outstanding - Get all outstanding (unpaid) receipts
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const sortBy = searchParams.get("sortBy") || "date"; // date, amount, patient

    const receipts = await getReceiptsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Build sort option
    let sortOption: Record<string, 1 | -1> = { receiptDate: -1 };
    if (sortBy === "amount") {
      sortOption = { totalAmount: -1 };
    } else if (sortBy === "patient") {
      sortOption = { "patientSnapshot.name": 1 };
    }

    // Find all unpaid receipts
    const unpaidReceipts = await receipts
      .find({
        clinicId,
        isPaid: false,
      })
      .sort(sortOption)
      .limit(limit)
      .toArray();

    // Calculate summary stats
    const totalPending = unpaidReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const oldestPending = unpaidReceipts.length > 0
      ? unpaidReceipts.reduce((oldest, r) => 
          r.receiptDate < oldest.receiptDate ? r : oldest
        )
      : null;

    // Calculate days overdue for each receipt
    const now = new Date();
    const receiptsWithAge = unpaidReceipts.map((receipt) => {
      const daysDiff = Math.floor(
        (now.getTime() - new Date(receipt.receiptDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...receipt,
        _id: receipt._id.toString(),
        clinicId: receipt.clinicId.toString(),
        visitId: receipt.visitId?.toString(),
        createdBy: receipt.createdBy.toString(),
        daysOverdue: daysDiff,
      };
    });

    // Group by age
    const ageGroups = {
      today: receiptsWithAge.filter((r) => r.daysOverdue === 0).length,
      thisWeek: receiptsWithAge.filter((r) => r.daysOverdue > 0 && r.daysOverdue <= 7).length,
      thisMonth: receiptsWithAge.filter((r) => r.daysOverdue > 7 && r.daysOverdue <= 30).length,
      older: receiptsWithAge.filter((r) => r.daysOverdue > 30).length,
    };

    return NextResponse.json({
      receipts: receiptsWithAge,
      summary: {
        totalCount: unpaidReceipts.length,
        totalPending,
        oldestReceiptDate: oldestPending?.receiptDate || null,
        ageGroups,
      },
    });
  } catch (error) {
    console.error("Get outstanding receipts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/billing/outstanding - Mark multiple receipts as paid
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiptIds, paymentMode } = body;

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: "Receipt IDs are required" },
        { status: 400 }
      );
    }

    const receipts = await getReceiptsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Update all specified receipts
    const result = await receipts.updateMany(
      {
        _id: { $in: receiptIds.map((id: string) => new ObjectId(id)) },
        clinicId,
        isPaid: false,
      },
      {
        $set: {
          isPaid: true,
          paymentMode: paymentMode || undefined,
        },
      }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark receipts paid error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
