import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getBudgetTargetsCollection } from "@/lib/db/collections";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils/date";
import type { BillingOverview } from "@/types";

// GET /api/billing/overview - Get billing overview stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receipts = await getReceiptsCollection();
    const budgetTargets = await getBudgetTargetsCollection();
    const clinicId = new ObjectId(session.clinicId);
    const now = new Date();

    // Date ranges
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    
    // Last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    // Aggregation pipeline for today's stats
    const todayStats = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          totalReceipts: { $sum: 1 },
          pendingAmount: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
        },
      },
    ]).toArray();

    // This month's stats
    const thisMonthStats = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          totalReceipts: { $sum: 1 },
          pendingAmount: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
        },
      },
    ]).toArray();

    // Last month's stats
    const lastMonthStats = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          totalReceipts: { $sum: 1 },
        },
      },
    ]).toArray();

    // All time stats
    const allTimeStats = await receipts.aggregate([
      {
        $match: { clinicId },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          totalReceipts: { $sum: 1 },
        },
      },
    ]).toArray();

    // Get current month's budget target
    const currentTarget = await budgetTargets.findOne({
      clinicId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    const overview: BillingOverview = {
      today: {
        revenue: todayStats[0]?.totalRevenue || 0,
        receipts: todayStats[0]?.totalReceipts || 0,
        pending: todayStats[0]?.pendingAmount || 0,
      },
      thisMonth: {
        revenue: thisMonthStats[0]?.totalRevenue || 0,
        receipts: thisMonthStats[0]?.totalReceipts || 0,
        pending: thisMonthStats[0]?.pendingAmount || 0,
        target: currentTarget?.targetRevenue,
      },
      lastMonth: {
        revenue: lastMonthStats[0]?.totalRevenue || 0,
        receipts: lastMonthStats[0]?.totalReceipts || 0,
      },
      allTime: {
        totalRevenue: allTimeStats[0]?.totalRevenue || 0,
        totalReceipts: allTimeStats[0]?.totalReceipts || 0,
        avgReceiptValue: allTimeStats[0]?.totalReceipts
          ? Math.round((allTimeStats[0]?.totalRevenue || 0) / allTimeStats[0].totalReceipts)
          : 0,
      },
    };

    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Get billing overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
