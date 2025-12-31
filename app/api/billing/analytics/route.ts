import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection } from "@/lib/db/collections";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "@/lib/utils/date";
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

    const receipts = await getReceiptsCollection();
    const clinicId = new ObjectId(session.clinicId);

    // Get monthly revenue for the last N months
    const monthlyRevenueData: MonthlyRevenue[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      const stats = await receipts.aggregate([
        {
          $match: {
            clinicId,
            receiptDate: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
            totalReceipts: { $sum: 1 },
            paidAmount: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
            unpaidAmount: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
            totalDiscount: { $sum: "$discountAmount" },
          },
        },
      ]).toArray();

      monthlyRevenueData.push({
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        totalRevenue: stats[0]?.totalRevenue || 0,
        totalReceipts: stats[0]?.totalReceipts || 0,
        paidAmount: stats[0]?.paidAmount || 0,
        unpaidAmount: stats[0]?.unpaidAmount || 0,
        totalDiscount: stats[0]?.totalDiscount || 0,
        avgReceiptValue: stats[0]?.totalReceipts
          ? Math.round((stats[0]?.paidAmount || 0) / stats[0].totalReceipts)
          : 0,
      });
    }

    // Get payment mode breakdown for the specified month or current month
    const targetMonth = month 
      ? new Date(year, month - 1, 1)
      : new Date();
    const paymentMonthStart = startOfMonth(targetMonth);
    const paymentMonthEnd = endOfMonth(targetMonth);

    const paymentModeStats = await receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: paymentMonthStart, $lte: paymentMonthEnd },
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$paymentMode", "unpaid"] },
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]).toArray();

    const totalPayments = paymentModeStats.reduce((sum, item) => sum + item.amount, 0);
    const paymentModeBreakdown: PaymentModeBreakdown[] = paymentModeStats.map((item) => ({
      mode: item._id,
      count: item.count,
      amount: item.amount,
      percentage: totalPayments > 0 ? Math.round((item.amount / totalPayments) * 100) : 0,
    }));

    // Get daily revenue for the specified month
    const dailyRevenueData: DailyRevenue[] = [];
    const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
      const dayStart = startOfDay(dayDate);
      const dayEnd = endOfDay(dayDate);

      const dayStats = await receipts.aggregate([
        {
          $match: {
            clinicId,
            receiptDate: { $gte: dayStart, $lte: dayEnd },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
            receipts: { $sum: 1 },
          },
        },
      ]).toArray();

      dailyRevenueData.push({
        date: dayDate.toISOString().split("T")[0],
        revenue: dayStats[0]?.revenue || 0,
        receipts: dayStats[0]?.receipts || 0,
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
