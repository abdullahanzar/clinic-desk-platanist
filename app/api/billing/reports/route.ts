import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/sqlite";
import { receipts, expenses, budgetTargets } from "@/lib/db/schema";

// GET /api/billing/reports - Generate billing reports
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "monthly"; // monthly, yearly, custom
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : new Date().getMonth() + 1;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const db = getDb();

    let dateStart: string;
    let dateEnd: string;
    let displayText: string;

    if (reportType === "custom" && startDateParam && endDateParam) {
      dateStart = new Date(startDateParam).toISOString();
      const endD = new Date(endDateParam);
      endD.setHours(23, 59, 59, 999);
      dateEnd = endD.toISOString();
      const startDisplay = new Date(startDateParam);
      const endDisplay = new Date(endDateParam);
      displayText = `${startDisplay.getDate().toString().padStart(2, "0")}/${(startDisplay.getMonth() + 1).toString().padStart(2, "0")}/${startDisplay.getFullYear()} - ${endDisplay.getDate().toString().padStart(2, "0")}/${(endDisplay.getMonth() + 1).toString().padStart(2, "0")}/${endDisplay.getFullYear()}`;
    } else if (reportType === "yearly") {
      dateStart = `${year}-01-01T00:00:00.000Z`;
      dateEnd = `${year}-12-31T23:59:59.999Z`;
      displayText = `Year ${year}`;
    } else {
      // Monthly (default)
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      const lastDay = new Date(year, month, 0).getDate();
      dateStart = `${monthStr}-01T00:00:00.000Z`;
      dateEnd = `${monthStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;
      displayText = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }

    const clinicFilter = eq(receipts.clinicId, session.clinicId);
    const dateFilter = and(
      clinicFilter,
      gte(receipts.receiptDate, dateStart),
      lte(receipts.receiptDate, dateEnd),
    );

    // Get receipt summary
    const receiptData = db.select({
      totalReceipts: sql<number>`count(*)`,
      grossRevenue: sql<number>`coalesce(sum(${receipts.subtotal}), 0)`,
      totalDiscount: sql<number>`coalesce(sum(${receipts.discountAmount}), 0)`,
      netRevenue: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)`,
      paidAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      unpaidAmount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
      paidCount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then 1 else 0 end), 0)`,
      unpaidCount: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then 1 else 0 end), 0)`,
    }).from(receipts).where(dateFilter).get();

    // Get payment mode breakdown
    const paymentBreakdown = db.select({
      mode: receipts.paymentMode,
      count: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)`,
    }).from(receipts).where(and(
      dateFilter,
      eq(receipts.isPaid, true),
    )).groupBy(receipts.paymentMode)
      .orderBy(sql`sum(${receipts.totalAmount}) desc`)
      .all();

    // Get daily breakdown
    const dailyBreakdown = db.select({
      date: sql<string>`substr(${receipts.receiptDate}, 1, 10)`,
      receiptCount: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
    }).from(receipts).where(dateFilter)
      .groupBy(sql`substr(${receipts.receiptDate}, 1, 10)`)
      .orderBy(sql`substr(${receipts.receiptDate}, 1, 10) asc`)
      .all();

    // Get line item / service breakdown using json_each to unwind lineItems
    const serviceBreakdown = db.all(sql`
      SELECT
        json_extract(item.value, '$.description') as service,
        count(*) as count,
        coalesce(sum(json_extract(item.value, '$.amount')), 0) as amount
      FROM ${receipts}, json_each(${receipts.lineItems}) as item
      WHERE ${receipts.clinicId} = ${session.clinicId}
        AND ${receipts.receiptDate} >= ${dateStart}
        AND ${receipts.receiptDate} <= ${dateEnd}
      GROUP BY json_extract(item.value, '$.description')
      ORDER BY amount DESC
      LIMIT 10
    `) as Array<{ service: string; count: number; amount: number }>;

    // Get expenses for the same period
    const expenseClinicFilter = eq(expenses.clinicId, session.clinicId);
    const expenseDateFilter = and(
      expenseClinicFilter,
      gte(expenses.expenseDate, dateStart),
      lte(expenses.expenseDate, dateEnd),
    );

    const expenseData = db.select({
      totalExpenses: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      expenseCount: sql<number>`count(*)`,
    }).from(expenses).where(expenseDateFilter).get();

    // Expense breakdown by category
    const expenseBreakdown = db.select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      count: sql<number>`count(*)`,
    }).from(expenses).where(expenseDateFilter)
      .groupBy(expenses.category)
      .orderBy(sql`sum(${expenses.amount}) desc`)
      .all();

    // Get budget target for the month (if monthly report)
    let budgetTarget = null;
    if (reportType === "monthly") {
      budgetTarget = db.select()
        .from(budgetTargets)
        .where(and(
          eq(budgetTargets.clinicId, session.clinicId),
          eq(budgetTargets.year, year),
          eq(budgetTargets.month, month),
        )).get();
    }

    // Calculate profit/loss
    const totalRevenue = receiptData?.paidAmount || 0;
    const totalExpenses = expenseData?.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;

    const report = {
      period: {
        type: reportType,
        startDate: dateStart,
        endDate: dateEnd,
        displayText,
      },
      revenue: {
        totalReceipts: receiptData?.totalReceipts || 0,
        grossRevenue: receiptData?.grossRevenue || 0,
        totalDiscount: receiptData?.totalDiscount || 0,
        netRevenue: receiptData?.netRevenue || 0,
        collected: receiptData?.paidAmount || 0,
        pending: receiptData?.unpaidAmount || 0,
        paidCount: receiptData?.paidCount || 0,
        unpaidCount: receiptData?.unpaidCount || 0,
        averageReceiptValue: receiptData?.totalReceipts
          ? Math.round((receiptData?.netRevenue || 0) / receiptData.totalReceipts)
          : 0,
      },
      paymentModes: paymentBreakdown.map((p) => ({
        mode: p.mode || "Not specified",
        count: p.count,
        amount: p.amount,
      })),
      dailyCollection: dailyBreakdown.map((d) => ({
        date: d.date,
        receipts: d.receiptCount,
        revenue: d.revenue,
        pending: d.pending,
      })),
      topServices: serviceBreakdown.map((s) => ({
        service: s.service,
        count: s.count,
        amount: s.amount,
      })),
      expenses: {
        total: totalExpenses,
        count: expenseData?.expenseCount || 0,
        byCategory: expenseBreakdown.map((e) => ({
          category: e.category,
          total: e.total,
          count: e.count,
        })),
      },
      profitLoss: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
      },
      budget: budgetTarget
        ? {
            targetRevenue: budgetTarget.targetRevenue,
            targetExpenses: budgetTarget.targetExpenses,
            revenueAchieved: Math.round((totalRevenue / budgetTarget.targetRevenue) * 100),
            revenueGap: budgetTarget.targetRevenue - totalRevenue,
          }
        : null,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
