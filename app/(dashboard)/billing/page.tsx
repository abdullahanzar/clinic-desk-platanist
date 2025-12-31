import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getBudgetTargetsCollection, getExpensesCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils/date";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Clock, 
  Target,
  BarChart3,
  FileText,
  AlertCircle,
  Wallet,
  ArrowRight,
  Calendar
} from "lucide-react";

export default async function BillingDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const receipts = await getReceiptsCollection();
  const budgetTargets = await getBudgetTargetsCollection();
  const expenses = await getExpensesCollection();
  const clinicId = new ObjectId(session.clinicId);
  const now = new Date();

  // Date ranges
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);

  // Get all stats in parallel
  const [
    todayStats,
    thisMonthStats,
    lastMonthStats,
    allTimeStats,
    unpaidCount,
    currentTarget,
    thisMonthExpenses,
    recentReceipts,
  ] = await Promise.all([
    // Today's stats
    receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          count: { $sum: 1 },
          pending: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
        },
      },
    ]).toArray(),

    // This month's stats
    receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          count: { $sum: 1 },
          pending: { $sum: { $cond: ["$isPaid", 0, "$totalAmount"] } },
          discount: { $sum: "$discountAmount" },
        },
      },
    ]).toArray(),

    // Last month's stats
    receipts.aggregate([
      {
        $match: {
          clinicId,
          receiptDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),

    // All time stats
    receipts.aggregate([
      {
        $match: { clinicId },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: ["$isPaid", "$totalAmount", 0] } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),

    // Unpaid receipts count
    receipts.countDocuments({ clinicId, isPaid: false }),

    // Current month's budget target
    budgetTargets.findOne({
      clinicId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }),

    // This month's expenses
    expenses.aggregate([
      {
        $match: {
          clinicId,
          expenseDate: { $gte: thisMonthStart, $lte: thisMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]).toArray(),

    // Recent receipts
    receipts.find({ clinicId }).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);

  // Calculate values
  const todayRevenue = todayStats[0]?.revenue || 0;
  const todayReceipts = todayStats[0]?.count || 0;
  const thisMonthRevenue = thisMonthStats[0]?.revenue || 0;
  const thisMonthReceipts = thisMonthStats[0]?.count || 0;
  const thisMonthPending = thisMonthStats[0]?.pending || 0;
  const thisMonthDiscount = thisMonthStats[0]?.discount || 0;
  const lastMonthRevenue = lastMonthStats[0]?.revenue || 0;
  const allTimeRevenue = allTimeStats[0]?.revenue || 0;
  const allTimeReceipts = allTimeStats[0]?.count || 0;
  const monthlyExpenses = thisMonthExpenses[0]?.total || 0;

  // Calculate growth
  const monthGrowth = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  // Budget progress
  const budgetTarget = currentTarget?.targetRevenue || 0;
  const budgetProgress = budgetTarget > 0
    ? Math.min(100, Math.round((thisMonthRevenue / budgetTarget) * 100))
    : 0;

  // Net profit this month
  const netProfit = thisMonthRevenue - monthlyExpenses;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Billing & Finance</h1>
        <p className="text-sm text-slate-500 mt-1">
          {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* Today's Collection */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium">Today</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">₹{todayRevenue.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-emerald-600 mt-1">{todayReceipts} receipts</p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl border border-brand-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            <span className={`text-xs font-medium flex items-center gap-1 ${monthGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {monthGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {monthGrowth}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-700">₹{thisMonthRevenue.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-brand-600 mt-1">This month</p>
        </div>

        {/* Outstanding */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {unpaidCount} pending
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700">₹{thisMonthPending.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-amber-600 mt-1">Outstanding</p>
        </div>

        {/* Net Profit */}
        <div className={`bg-gradient-to-br rounded-2xl border p-4 sm:p-5 ${
          netProfit >= 0 
            ? "from-violet-50 to-violet-100 border-violet-200" 
            : "from-red-50 to-red-100 border-red-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Wallet className={`w-6 h-6 ${netProfit >= 0 ? "text-violet-600" : "text-red-600"}`} />
            <span className={`text-xs font-medium ${netProfit >= 0 ? "text-violet-600" : "text-red-600"}`}>
              This month
            </span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${netProfit >= 0 ? "text-violet-700" : "text-red-700"}`}>
            ₹{Math.abs(netProfit).toLocaleString()}
          </p>
          <p className={`text-xs sm:text-sm mt-1 ${netProfit >= 0 ? "text-violet-600" : "text-red-600"}`}>
            {netProfit >= 0 ? "Net Profit" : "Net Loss"}
          </p>
        </div>
      </div>

      {/* Budget Progress (if set) */}
      {budgetTarget > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900">Monthly Target Progress</h3>
            </div>
            <span className="text-sm text-slate-500">
              ₹{thisMonthRevenue.toLocaleString()} of ₹{budgetTarget.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetProgress >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                    : budgetProgress >= 75 
                    ? "bg-gradient-to-r from-brand-500 to-brand-600"
                    : budgetProgress >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={`font-semibold ${
                budgetProgress >= 100 ? "text-emerald-600" : "text-slate-700"
              }`}>
                {budgetProgress}% achieved
              </span>
              <span className="text-slate-500">
                {budgetTarget - thisMonthRevenue > 0 
                  ? `₹${(budgetTarget - thisMonthRevenue).toLocaleString()} to go`
                  : "Target exceeded! 🎉"
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">All Time Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{allTimeRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Receipts</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{allTimeReceipts.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Avg. Receipt</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ₹{allTimeReceipts > 0 ? Math.round(allTimeRevenue / allTimeReceipts).toLocaleString() : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Discounts Given</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{thisMonthDiscount.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/billing/analytics"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">View Analytics</p>
                  <p className="text-sm text-slate-500">Charts & trends</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>

            <Link
              href="/billing/outstanding"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Outstanding Payments</p>
                  <p className="text-sm text-slate-500">{unpaidCount} pending receipts</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>

            <Link
              href="/billing/reports"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Generate Reports</p>
                  <p className="text-sm text-slate-500">Monthly & yearly</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>

            <Link
              href="/billing/expenses"
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Track Expenses</p>
                  <p className="text-sm text-slate-500">₹{monthlyExpenses.toLocaleString()} this month</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Receipts</h3>
            <Link href="/receipts" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No receipts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReceipts.map((receipt) => (
                <Link
                  key={receipt._id.toString()}
                  href={`/receipts/${receipt._id.toString()}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      receipt.isPaid ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {receipt.patientSnapshot.name}
                      </p>
                      <p className="text-xs text-slate-500">{receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">₹{receipt.totalAmount}</p>
                    <p className={`text-xs ${receipt.isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                      {receipt.isPaid ? "Paid" : "Pending"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
