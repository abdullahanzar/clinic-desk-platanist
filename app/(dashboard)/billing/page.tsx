import { getSession } from "@/lib/auth/session";
import { getDb, receipts, budgetTargets, expenses } from "@/lib/db/collections";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
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

  const db = getDb();
  const clinicId = session.clinicId;
  const now = new Date();

  // Date ranges
  const todayStartISO = startOfDay(now).toISOString();
  const todayEndISO = endOfDay(now).toISOString();
  const thisMonthStartISO = startOfMonth(now).toISOString();
  const thisMonthEndISO = endOfMonth(now).toISOString();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStartISO = startOfMonth(lastMonth).toISOString();
  const lastMonthEndISO = endOfMonth(lastMonth).toISOString();

  // Today's stats
  const todayStats = db.select({
    revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
    count: count(),
    pending: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
  }).from(receipts)
    .where(and(eq(receipts.clinicId, clinicId), gte(receipts.receiptDate, todayStartISO), lte(receipts.receiptDate, todayEndISO)))
    .get();

  // This month's stats
  const thisMonthStats = db.select({
    revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
    count: count(),
    pending: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 0 then ${receipts.totalAmount} else 0 end), 0)`,
    discount: sql<number>`coalesce(sum(${receipts.discountAmount}), 0)`,
  }).from(receipts)
    .where(and(eq(receipts.clinicId, clinicId), gte(receipts.receiptDate, thisMonthStartISO), lte(receipts.receiptDate, thisMonthEndISO)))
    .get();

  // Last month's stats
  const lastMonthStats = db.select({
    revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
    count: count(),
  }).from(receipts)
    .where(and(eq(receipts.clinicId, clinicId), gte(receipts.receiptDate, lastMonthStartISO), lte(receipts.receiptDate, lastMonthEndISO)))
    .get();

  // All time stats
  const allTimeStats = db.select({
    revenue: sql<number>`coalesce(sum(case when ${receipts.isPaid} = 1 then ${receipts.totalAmount} else 0 end), 0)`,
    count: count(),
  }).from(receipts)
    .where(eq(receipts.clinicId, clinicId))
    .get();

  // Unpaid receipts count
  const unpaidCount = db.select({ value: count() }).from(receipts)
    .where(and(eq(receipts.clinicId, clinicId), eq(receipts.isPaid, false)))
    .get()!.value;

  // Current month's budget target
  const currentTarget = db.select().from(budgetTargets)
    .where(and(eq(budgetTargets.clinicId, clinicId), eq(budgetTargets.year, now.getFullYear()), eq(budgetTargets.month, now.getMonth() + 1)))
    .get();

  // This month's expenses
  const thisMonthExpensesResult = db.select({
    total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
  }).from(expenses)
    .where(and(eq(expenses.clinicId, clinicId), gte(expenses.expenseDate, thisMonthStartISO), lte(expenses.expenseDate, thisMonthEndISO)))
    .get();

  // Recent receipts
  const recentReceipts = db.select().from(receipts)
    .where(eq(receipts.clinicId, clinicId))
    .orderBy(desc(receipts.createdAt))
    .limit(5)
    .all();

  // Calculate values
  const todayRevenue = todayStats?.revenue || 0;
  const todayReceipts = todayStats?.count || 0;
  const thisMonthRevenue = thisMonthStats?.revenue || 0;
  const thisMonthReceipts = thisMonthStats?.count || 0;
  const thisMonthPending = thisMonthStats?.pending || 0;
  const thisMonthDiscount = thisMonthStats?.discount || 0;
  const lastMonthRevenue = lastMonthStats?.revenue || 0;
  const allTimeRevenue = allTimeStats?.revenue || 0;
  const allTimeReceipts = allTimeStats?.count || 0;
  const monthlyExpenses = thisMonthExpensesResult?.total || 0;

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Billing & Finance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* Today's Collection */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-emerald-100 p-4 sm:p-5 dark:border-emerald-800 dark:from-emerald-950 dark:to-emerald-900">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Today</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">₹{todayRevenue.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-1">{todayReceipts} receipts</p>
        </div>

        {/* This Month */}
        <div className="rounded-2xl border border-selected-border bg-linear-to-br from-brand-50 to-brand-100 p-4 sm:p-5 dark:from-selected-bg dark:to-slate-900">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-6 h-6 text-brand-600 dark:text-selected-text" />
            <span className={`text-xs font-medium flex items-center gap-1 ${monthGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {monthGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {monthGrowth}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-700 dark:text-selected-text">₹{thisMonthRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs sm:text-sm text-brand-600 dark:text-selected-muted-text">This month</p>
        </div>

        {/* Outstanding */}
        <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-amber-100 p-4 sm:p-5 dark:border-amber-800 dark:from-amber-950 dark:to-amber-900">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
              {unpaidCount} pending
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">₹{thisMonthPending.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1">Outstanding</p>
        </div>

        {/* Net Profit */}
        <div className={`bg-linear-to-br rounded-2xl border p-4 sm:p-5 ${
          netProfit >= 0 
            ? "from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-violet-200 dark:border-violet-800" 
            : "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Wallet className={`w-6 h-6 ${netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-red-600 dark:text-red-400"}`} />
            <span className={`text-xs font-medium ${netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-red-600 dark:text-red-400"}`}>
              This month
            </span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${netProfit >= 0 ? "text-violet-700 dark:text-violet-300" : "text-red-700 dark:text-red-300"}`}>
            ₹{Math.abs(netProfit).toLocaleString()}
          </p>
          <p className={`text-xs sm:text-sm mt-1 ${netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-red-600 dark:text-red-400"}`}>
            {netProfit >= 0 ? "Net Profit" : "Net Loss"}
          </p>
        </div>
      </div>

      {/* Budget Progress (if set) */}
      {budgetTarget > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600 dark:text-selected-text" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monthly Target Progress</h3>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ₹{thisMonthRevenue.toLocaleString()} of ₹{budgetTarget.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetProgress >= 100 
                    ? "bg-linear-to-r from-emerald-500 to-emerald-600" 
                    : budgetProgress >= 75 
                    ? "bg-linear-to-r from-brand-500 to-brand-600"
                    : budgetProgress >= 50
                    ? "bg-linear-to-r from-amber-500 to-amber-600"
                    : "bg-linear-to-r from-red-500 to-red-600"
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={`font-semibold ${
                budgetProgress >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
              }`}>
                {budgetProgress}% achieved
              </span>
              <span className="text-slate-500 dark:text-slate-400">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">All Time Revenue</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">₹{allTimeRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Receipts</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{allTimeReceipts.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg. Receipt</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{allTimeReceipts > 0 ? Math.round(allTimeRevenue / allTimeReceipts).toLocaleString() : 0}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Discounts Given</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">₹{thisMonthDiscount.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/billing/analytics"
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-selected-border bg-selected-bg">
                  <BarChart3 className="w-5 h-5 text-brand-600 dark:text-selected-text" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">View Analytics</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Charts & trends</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </Link>

            <Link
              href="/billing/outstanding"
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Outstanding Payments</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{unpaidCount} pending receipts</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </Link>

            <Link
              href="/billing/reports"
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Generate Reports</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Monthly & yearly</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </Link>

            <Link
              href="/billing/expenses"
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Track Expenses</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">₹{monthlyExpenses.toLocaleString()} this month</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300" />
            </Link>
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Receipts</h3>
            <Link href="/receipts" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
              View all
            </Link>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400">No receipts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReceipts.map((receipt) => (
                <Link
                  key={receipt.id}
                  href={`/receipts/${receipt.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${
                      receipt.isPaid ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {receipt.patientSnapshot.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">₹{receipt.totalAmount}</p>
                    <p className={`text-xs ${receipt.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
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
