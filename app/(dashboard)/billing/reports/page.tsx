"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  PieChart
} from "lucide-react";

interface ReportData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
    displayText: string;
  };
  revenue: {
    totalReceipts: number;
    grossRevenue: number;
    totalDiscount: number;
    netRevenue: number;
    collected: number;
    pending: number;
    paidCount: number;
    unpaidCount: number;
    averageReceiptValue: number;
  };
  paymentModes: { mode: string; count: number; amount: number }[];
  dailyCollection: { date: string; receipts: number; revenue: number; pending: number }[];
  topServices: { service: string; count: number; amount: number }[];
  expenses: {
    total: number;
    count: number;
    byCategory: { category: string; total: number; count: number }[];
  };
  profitLoss: {
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
  };
  budget: {
    targetRevenue: number;
    targetExpenses?: number;
    revenueAchieved: number;
    revenueGap: number;
  } | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  salary: "Salaries",
  supplies: "Supplies",
  utilities: "Utilities",
  equipment: "Equipment",
  maintenance: "Maintenance",
  marketing: "Marketing",
  insurance: "Insurance",
  taxes: "Taxes",
  other: "Other",
};

export default function BillingReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      const res = await fetch(`/api/billing/reports?${params}`);
      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const exportToCSV = () => {
    if (!report) return;

    const rows: string[][] = [
      ["Report Period", report.period.displayText],
      [""],
      ["REVENUE SUMMARY"],
      ["Total Receipts", report.revenue.totalReceipts.toString()],
      ["Gross Revenue", `₹${report.revenue.grossRevenue}`],
      ["Total Discount", `₹${report.revenue.totalDiscount}`],
      ["Net Revenue", `₹${report.revenue.netRevenue}`],
      ["Collected", `₹${report.revenue.collected}`],
      ["Pending", `₹${report.revenue.pending}`],
      ["Average Receipt Value", `₹${report.revenue.averageReceiptValue}`],
      [""],
      ["PAYMENT MODES"],
      ["Mode", "Count", "Amount"],
      ...report.paymentModes.map((p) => [p.mode, p.count.toString(), `₹${p.amount}`]),
      [""],
      ["EXPENSES"],
      ["Total Expenses", `₹${report.expenses.total}`],
      ["Category", "Count", "Amount"],
      ...report.expenses.byCategory.map((e) => [
        CATEGORY_LABELS[e.category] || e.category,
        e.count.toString(),
        `₹${e.total}`,
      ]),
      [""],
      ["PROFIT/LOSS"],
      ["Revenue", `₹${report.profitLoss.revenue}`],
      ["Expenses", `₹${report.profitLoss.expenses}`],
      ["Net Profit", `₹${report.profitLoss.netProfit}`],
      ["Profit Margin", `${report.profitLoss.profitMargin}%`],
    ];

    if (report.budget) {
      rows.push(
        [""],
        ["BUDGET"],
        ["Target Revenue", `₹${report.budget.targetRevenue}`],
        ["Achieved", `${report.budget.revenueAchieved}%`],
        ["Gap", `₹${report.budget.revenueGap}`]
      );
    }

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing-report-${report.period.displayText.replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load report</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/billing"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Financial Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Generate and export billing reports</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Type & Period Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Report Type Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                reportType === "monthly"
                  ? "bg-white shadow text-brand-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                reportType === "yearly"
                  ? "bg-white shadow text-brand-600"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Period Navigation */}
          {reportType === "monthly" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span className="font-medium text-slate-900 min-w-[120px] text-center">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span className="font-medium text-slate-900">Year {selectedYear}</span>
              </div>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Title */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6" />
          <h2 className="text-lg font-semibold">
            {reportType === "monthly" ? "Monthly" : "Yearly"} Financial Report
          </h2>
        </div>
        <p className="text-brand-100">{report.period.displayText}</p>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Revenue Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 uppercase tracking-wide">Collected</p>
            <p className="text-2xl font-bold text-emerald-700">₹{report.revenue.collected.toLocaleString()}</p>
            <p className="text-xs text-emerald-600">{report.revenue.paidCount} receipts</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-700">₹{report.revenue.pending.toLocaleString()}</p>
            <p className="text-xs text-amber-600">{report.revenue.unpaidCount} receipts</p>
          </div>
          <div className="p-4 bg-violet-50 rounded-xl">
            <p className="text-xs text-violet-600 uppercase tracking-wide">Discounts Given</p>
            <p className="text-2xl font-bold text-violet-700">₹{report.revenue.totalDiscount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Avg Receipt</p>
            <p className="text-2xl font-bold text-slate-700">₹{report.revenue.averageReceiptValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Profit/Loss & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profit/Loss */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-violet-600" />
            Profit & Loss
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-600">Revenue (Collected)</span>
              <span className="font-semibold text-emerald-600">+₹{report.profitLoss.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-600">Expenses</span>
              <span className="font-semibold text-red-600">-₹{report.profitLoss.expenses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-slate-900">Net Profit</span>
              <div className="text-right">
                <span className={`text-xl font-bold ${report.profitLoss.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {report.profitLoss.netProfit >= 0 ? "+" : ""}₹{report.profitLoss.netProfit.toLocaleString()}
                </span>
                <p className="text-xs text-slate-500">{report.profitLoss.profitMargin}% margin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Budget vs Actual
          </h3>
          {report.budget ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Target: ₹{report.budget.targetRevenue.toLocaleString()}</span>
                  <span className={`font-medium ${report.budget.revenueAchieved >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                    {report.budget.revenueAchieved}%
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      report.budget.revenueAchieved >= 100
                        ? "bg-emerald-500"
                        : report.budget.revenueAchieved >= 75
                        ? "bg-brand-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, report.budget.revenueAchieved)}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-600">Actual Revenue</span>
                  <span className="font-semibold text-slate-900">₹{report.profitLoss.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-600">Gap to Target</span>
                  <span className={`font-semibold ${report.budget.revenueGap > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {report.budget.revenueGap > 0 ? "-" : "+"}₹{Math.abs(report.budget.revenueGap).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No budget target set for this period</p>
              <Link
                href="/billing/budget"
                className="text-brand-600 hover:text-brand-700 font-medium text-sm"
              >
                Set Budget Target →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modes & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Modes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Payment Modes
          </h3>
          {report.paymentModes.length > 0 ? (
            <div className="space-y-3">
              {report.paymentModes.map((mode) => (
                <div key={mode.mode} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-700 capitalize">
                      {mode.mode === "upi" ? "UPI" : mode.mode}
                    </span>
                    <span className="text-xs text-slate-500">({mode.count})</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{mode.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No payment data</p>
          )}
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            Top Services
          </h3>
          {report.topServices.length > 0 ? (
            <div className="space-y-3">
              {report.topServices.slice(0, 5).map((service, index) => (
                <div key={service.service} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">{service.service}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">₹{service.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{service.count}x</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No service data</p>
          )}
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-red-600" />
          Expense Breakdown
        </h3>
        {report.expenses.byCategory.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {report.expenses.byCategory.map((expense) => (
              <div key={expense.category} className="p-4 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 uppercase tracking-wide">
                  {CATEGORY_LABELS[expense.category] || expense.category}
                </p>
                <p className="text-lg font-bold text-red-700">₹{expense.total.toLocaleString()}</p>
                <p className="text-xs text-red-600">{expense.count} transactions</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No expenses recorded for this period</p>
        )}
      </div>
    </div>
  );
}
