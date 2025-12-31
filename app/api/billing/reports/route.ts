import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getExpensesCollection, getBudgetTargetsCollection } from "@/lib/db/collections";
import { startOfMonth, endOfMonth, formatDateIndian } from "@/lib/utils/date";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const receipts = await getReceiptsCollection();
    const expenses = await getExpensesCollection();
    const budgetTargets = await getBudgetTargetsCollection();
    const clinicId = new ObjectId(session.clinicId);

    let dateStart: Date;
    let dateEnd: Date;

    if (reportType === "custom" && startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (reportType === "yearly") {
      dateStart = new Date(year, 0, 1);
      dateEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      // Monthly (default)
      const targetDate = new Date(year, month - 1, 1);
      dateStart = startOfMonth(targetDate);
      dateEnd = endOfMonth(targetDate);
    }

    // Get all receipts in date range
    const receiptData = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalReceipts: { $sum: 1 },
          grossRevenue: { $sum: "$subtotal" },
          totalDiscount: { $sum: "$discountAmount" },
          netRevenue: { $sum: "$totalAmount" },
          paidAmount: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          unpaidAmount: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
          paidCount: { $sum: { $cond: ["$isPaid", 1, 0] } },
          unpaidCount: { $sum: { $cond: ["$isPaid", 0, 1] } },
        },
      },
    ]).toArray();

    // Get payment mode breakdown
    const paymentBreakdown = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: dateStart, $lte: dateEnd },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: "$paymentMode",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]).toArray();

    // Get daily breakdown
    const dailyBreakdown = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$receiptDate" },
          },
          receipts: { $sum: 1 },
          revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          pending: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).toArray();

    // Get line item breakdown (what services are earning the most)
    const serviceBreakdown = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: dateStart, $lte: dateEnd },
        },
      },
      { $unwind: "$lineItems" },
      {
        $group: {
          _id: "$lineItems.description",
          count: { $sum: 1 },
          totalAmount: { $sum: "$lineItems.amount" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
      { $limit: 10 },
    ]).toArray();

    // Get expenses for the same period
    const expenseData = await expenses.aggregate([
      {
        $match: {
          clinicId,
          expenseDate: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]).toArray();

    // Get expense breakdown by category
    const expenseBreakdown = await expenses.aggregate([
      {
        $match: {
          clinicId,
          expenseDate: { $gte: dateStart, $lte: dateEnd },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]).toArray();

    // Get budget target for the month (if monthly report)
    let budgetTarget = null;
    if (reportType === "monthly") {
      budgetTarget = await budgetTargets.findOne({
        clinicId,
        year,
        month,
      });
    }

    // Calculate profit/loss
    const totalRevenue = receiptData[0]?.paidAmount || 0;
    const totalExpenses = expenseData[0]?.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;

    // Build report
    const report = {
      period: {
        type: reportType,
        startDate: dateStart.toISOString(),
        endDate: dateEnd.toISOString(),
        displayText: reportType === "monthly"
          ? `${new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
          : reportType === "yearly"
          ? `Year ${year}`
          : `${formatDateIndian(dateStart)} - ${formatDateIndian(dateEnd)}`,
      },
      revenue: {
        totalReceipts: receiptData[0]?.totalReceipts || 0,
        grossRevenue: receiptData[0]?.grossRevenue || 0,
        totalDiscount: receiptData[0]?.totalDiscount || 0,
        netRevenue: receiptData[0]?.netRevenue || 0,
        collected: receiptData[0]?.paidAmount || 0,
        pending: receiptData[0]?.unpaidAmount || 0,
        paidCount: receiptData[0]?.paidCount || 0,
        unpaidCount: receiptData[0]?.unpaidCount || 0,
        averageReceiptValue: receiptData[0]?.totalReceipts
          ? Math.round((receiptData[0]?.netRevenue || 0) / receiptData[0].totalReceipts)
          : 0,
      },
      paymentModes: paymentBreakdown.map((p) => ({
        mode: p._id || "Not specified",
        count: p.count,
        amount: p.amount,
      })),
      dailyCollection: dailyBreakdown.map((d) => ({
        date: d._id,
        receipts: d.receipts,
        revenue: d.revenue,
        pending: d.pending,
      })),
      topServices: serviceBreakdown.map((s) => ({
        service: s._id,
        count: s.count,
        amount: s.totalAmount,
      })),
      expenses: {
        total: totalExpenses,
        count: expenseData[0]?.expenseCount || 0,
        byCategory: expenseBreakdown.map((e) => ({
          category: e._id,
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
