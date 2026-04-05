import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts, budgetTargets } from "@/lib/db/schema";
import type { BillingOverview } from "@/types";

// GET /api/billing/overview - Get billing overview stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const now = new Date();

    // Date ranges as ISO strings for SQLite text comparison
    const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const todayStart = `${todayStr}T00:00:00.000Z`;
    const todayEnd = `${todayStr}T23:59:59.999Z`;

    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthStart = `${thisMonthStr}-01T00:00:00.000Z`;
    // End of this month
    const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const thisMonthEnd = `${thisMonthStr}-${String(lastDayThisMonth).padStart(2, "0")}T23:59:59.999Z`;

    // Last month
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthStart = `${lastMonthStr}-01T00:00:00.000Z`;
    const lastDayLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate();
    const lastMonthEnd = `${lastMonthStr}-${String(lastDayLastMonth).padStart(2, "0")}T23:59:59.999Z`;

    const clinicFilter = eq(receipts.clinicId, session.clinicId);

    // Today's stats
    const todayStats = db.select({
      totalRevenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      totalReceipts: sql<number>`count(*)`,
      pendingAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
    }).from(receipts).where(and(
      clinicFilter,
      gte(receipts.receiptDate, todayStart),
      lte(receipts.receiptDate, todayEnd),
    )).get();

    // This month's stats
    const thisMonthStats = db.select({
      totalRevenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      totalReceipts: sql<number>`count(*)`,
      pendingAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
    }).from(receipts).where(and(
      clinicFilter,
      gte(receipts.receiptDate, thisMonthStart),
      lte(receipts.receiptDate, thisMonthEnd),
    )).get();

    // Last month's stats
    const lastMonthStats = db.select({
      totalRevenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      totalReceipts: sql<number>`count(*)`,
    }).from(receipts).where(and(
      clinicFilter,
      gte(receipts.receiptDate, lastMonthStart),
      lte(receipts.receiptDate, lastMonthEnd),
    )).get();

    // All time stats
    const allTimeStats = db.select({
      totalRevenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      totalReceipts: sql<number>`count(*)`,
    }).from(receipts).where(clinicFilter).get();

    // Get current month's budget target
    const currentTarget = db.select()
      .from(budgetTargets)
      .where(and(
        eq(budgetTargets.clinicId, session.clinicId),
        eq(budgetTargets.year, now.getFullYear()),
        eq(budgetTargets.month, now.getMonth() + 1),
      )).get();

    const overview: BillingOverview = {
      today: {
        revenue: todayStats?.totalRevenue || 0,
        receipts: todayStats?.totalReceipts || 0,
        pending: todayStats?.pendingAmount || 0,
      },
      thisMonth: {
        revenue: thisMonthStats?.totalRevenue || 0,
        receipts: thisMonthStats?.totalReceipts || 0,
        pending: thisMonthStats?.pendingAmount || 0,
        target: currentTarget?.targetRevenue,
      },
      lastMonth: {
        revenue: lastMonthStats?.totalRevenue || 0,
        receipts: lastMonthStats?.totalReceipts || 0,
      },
      allTime: {
        totalRevenue: allTimeStats?.totalRevenue || 0,
        totalReceipts: allTimeStats?.totalReceipts || 0,
        avgReceiptValue: allTimeStats?.totalReceipts
          ? Math.round((allTimeStats?.totalRevenue || 0) / allTimeStats.totalReceipts)
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
