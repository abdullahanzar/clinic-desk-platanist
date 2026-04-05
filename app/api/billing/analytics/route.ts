import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts } from "@/lib/db/schema";
import type { MonthlyRevenue, PaymentModeBreakdown, DailyRevenue } from "@/types";

// GET /api/billing/analytics - Get detailed billing analytics
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "12", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : null;

    const db = getDb();
    const now = new Date();
    const clinicFilter = eq(receipts.clinicId, session.clinicId);

    // Get monthly revenue for the last N months using a single query with groupBy
    // Build date range covering all N months
    const oldestMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const oldestStart = `${oldestMonth.getFullYear()}-${String(oldestMonth.getMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    const latestEnd = (() => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;
    })();

    const monthlyRaw = db.select({
      monthKey: sql<string>`substr(${receipts.receiptDate}, 1, 7)`,
      totalRevenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      totalReceipts: sql<number>`count(*)`,
      paidAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      unpaidAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
      totalDiscount: sql<number>`coalesce(sum(${receipts.discountAmount}), 0)`,
    }).from(receipts).where(and(
      clinicFilter,
      gte(receipts.receiptDate, oldestStart),
      lte(receipts.receiptDate, latestEnd),
    )).groupBy(sql`substr(${receipts.receiptDate}, 1, 7)`)
      .orderBy(sql`substr(${receipts.receiptDate}, 1, 7) asc`)
      .all();

    // Build a map for quick lookup
    const monthlyMap = new Map(monthlyRaw.map((r) => [r.monthKey, r]));

    // Fill in all months (including zero-data months)
    const monthlyRevenueData: MonthlyRevenue[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
      const stats = monthlyMap.get(mKey);

      monthlyRevenueData.push({
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        totalRevenue: stats?.totalRevenue || 0,
        totalReceipts: stats?.totalReceipts || 0,
        paidAmount: stats?.paidAmount || 0,
        unpaidAmount: stats?.unpaidAmount || 0,
        totalDiscount: stats?.totalDiscount || 0,
        avgReceiptValue: stats?.totalReceipts
          ? Math.round((stats?.paidAmount || 0) / stats.totalReceipts)
          : 0,
      });
    }

    // Get payment mode breakdown for the specified month or current month
    const targetMonth = month
      ? new Date(year, month - 1, 1)
      : new Date();
    const paymentMonthStr = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`;
    const paymentLastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    const paymentStart = `${paymentMonthStr}-01T00:00:00.000Z`;
    const paymentEnd = `${paymentMonthStr}-${String(paymentLastDay).padStart(2, "0")}T23:59:59.999Z`;

    const paymentDateFilter = and(
      clinicFilter,
      gte(receipts.receiptDate, paymentStart),
      lte(receipts.receiptDate, paymentEnd),
    );

    const paymentModeStats = db.select({
      mode: sql<string>`coalesce(${receipts.paymentMode}, 'unpaid')`,
      count: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)`,
    }).from(receipts).where(paymentDateFilter)
      .groupBy(sql`coalesce(${receipts.paymentMode}, 'unpaid')`)
      .all();

    const totalPayments = paymentModeStats.reduce((sum, item) => sum + item.amount, 0);
    const paymentModeBreakdown: PaymentModeBreakdown[] = paymentModeStats.map((item) => ({
      mode: item.mode as PaymentModeBreakdown["mode"],
      count: item.count,
      amount: item.amount,
      percentage: totalPayments > 0 ? Math.round((item.amount / totalPayments) * 100) : 0,
    }));

    // Get daily revenue for the specified month using a single groupBy query
    const dailyRaw = db.select({
      date: sql<string>`substr(${receipts.receiptDate}, 1, 10)`,
      revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      receiptCount: sql<number>`count(*)`,
    }).from(receipts).where(paymentDateFilter)
      .groupBy(sql`substr(${receipts.receiptDate}, 1, 10)`)
      .orderBy(sql`substr(${receipts.receiptDate}, 1, 10) asc`)
      .all();

    const dailyMap = new Map(dailyRaw.map((d) => [d.date, d]));
    const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    const dailyRevenueData: DailyRevenue[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${paymentMonthStr}-${String(day).padStart(2, "0")}`;
      const dayData = dailyMap.get(dateStr);
      dailyRevenueData.push({
        date: dateStr,
        revenue: dayData?.revenue || 0,
        receipts: dayData?.receiptCount || 0,
      });
    }

    // Calculate month-over-month growth
    const currentMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 1]?.totalRevenue || 0;
    const previousMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 2]?.totalRevenue || 0;
    const monthOverMonthGrowth = previousMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : 0;

    // Get top revenue days
    const topRevenueDays = [...dailyRevenueData]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      monthlyRevenue: monthlyRevenueData,
      paymentModeBreakdown,
      dailyRevenue: dailyRevenueData,
      monthOverMonthGrowth,
      topRevenueDays,
      selectedMonth: {
        month: targetMonth.getMonth() + 1,
        year: targetMonth.getFullYear(),
      },
    });
  } catch (error) {
    console.error("Get billing analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
