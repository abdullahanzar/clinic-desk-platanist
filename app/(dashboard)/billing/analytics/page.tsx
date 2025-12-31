"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { MonthlyRevenue, PaymentModeBreakdown, DailyRevenue } from "@/types";

interface AnalyticsData {
  monthlyRevenue: MonthlyRevenue[];
  paymentModeBreakdown: PaymentModeBreakdown[];
  dailyRevenue: DailyRevenue[];
  monthOverMonthGrowth: number;
  topRevenueDays: DailyRevenue[];
  selectedMonth: { month: number; year: number };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PAYMENT_MODE_COLORS: Record<string, string> = {
  cash: "bg-emerald-500",
  upi: "bg-violet-500",
  card: "bg-blue-500",
  other: "bg-slate-500",
  unpaid: "bg-amber-500",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  other: "Other",
  unpaid: "Unpaid",
};

export default function BillingAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/billing/analytics?months=12&year=${selectedYear}&month=${selectedMonth}`
      );
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load analytics</p>
      </div>
    );
  }

  // Find max values for scaling charts
  const maxMonthlyRevenue = Math.max(...data.monthlyRevenue.map((m) => m.totalRevenue), 1);
  const maxDailyRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue), 1);
  const totalPaymentAmount = data.paymentModeBreakdown.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/billing"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Revenue Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Track your clinic&apos;s financial performance</p>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-slate-900">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth() + 1}
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Month over Month Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {data.monthOverMonthGrowth >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm text-slate-500">Month-over-Month</span>
          </div>
          <p className={`text-3xl font-bold ${data.monthOverMonthGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {data.monthOverMonthGrowth >= 0 ? "+" : ""}{data.monthOverMonthGrowth}%
          </p>
          <p className="text-xs text-slate-500 mt-1">compared to last month</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span className="text-sm text-slate-500">This Month&apos;s Revenue</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ₹{(data.monthlyRevenue[data.monthlyRevenue.length - 1]?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.monthlyRevenue[data.monthlyRevenue.length - 1]?.totalReceipts || 0} receipts
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-violet-600" />
            <span className="text-sm text-slate-500">Avg Receipt Value</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ₹{(data.monthlyRevenue[data.monthlyRevenue.length - 1]?.avgReceiptValue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">this month</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-6">Monthly Revenue Trend</h3>
        <div className="h-64 flex items-end gap-2">
          {data.monthlyRevenue.map((month, index) => {
            const height = (month.totalRevenue / maxMonthlyRevenue) * 100;
            const isCurrentMonth = month.month === selectedMonth && month.year === selectedYear;
            return (
              <div
                key={`${month.year}-${month.month}`}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">
                    ₹{(month.totalRevenue / 1000).toFixed(0)}k
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrentMonth 
                        ? "bg-gradient-to-t from-brand-600 to-brand-500" 
                        : "bg-gradient-to-t from-slate-300 to-slate-200"
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
                <span className={`text-xs ${isCurrentMonth ? "text-brand-600 font-medium" : "text-slate-500"}`}>
                  {MONTH_NAMES[month.month - 1].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Revenue & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Daily Collection - {MONTH_NAMES[selectedMonth - 1]}</h3>
          <div className="h-48 flex items-end gap-px overflow-x-auto">
            {data.dailyRevenue.map((day) => {
              const height = (day.revenue / maxDailyRevenue) * 100;
              const dayNum = new Date(day.date).getDate();
              return (
                <div
                  key={day.date}
                  className="flex-shrink-0 w-4 flex flex-col items-center group relative"
                >
                  <div
                    className="w-full bg-brand-500 rounded-t transition-all hover:bg-brand-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {dayNum % 5 === 1 && (
                    <span className="text-[10px] text-slate-500 mt-1">{dayNum}</span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {dayNum}/{selectedMonth}: ₹{day.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Mode Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Payment Mode Breakdown</h3>
          <div className="space-y-4">
            {data.paymentModeBreakdown.map((mode) => (
              <div key={mode.mode}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {PAYMENT_MODE_LABELS[mode.mode] || mode.mode}
                  </span>
                  <span className="text-sm text-slate-500">
                    ₹{mode.amount.toLocaleString()} ({mode.percentage}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${PAYMENT_MODE_COLORS[mode.mode] || "bg-slate-400"}`}
                    style={{ width: `${mode.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {data.paymentModeBreakdown.length === 0 && (
              <p className="text-slate-500 text-center py-8">No payment data for this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Revenue Days */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Top Revenue Days</h3>
        {data.topRevenueDays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {data.topRevenueDays.map((day, index) => {
              const date = new Date(day.date);
              return (
                <div
                  key={day.date}
                  className={`p-4 rounded-xl ${
                    index === 0 
                      ? "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200" 
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-bold ${index === 0 ? "text-amber-600" : "text-slate-400"}`}>
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">₹{day.revenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">
                    {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs text-slate-400">{day.receipts} receipts</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No revenue data for this month</p>
        )}
      </div>
    </div>
  );
}
