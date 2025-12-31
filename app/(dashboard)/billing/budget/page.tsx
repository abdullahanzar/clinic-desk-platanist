"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Target,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  TrendingUp
} from "lucide-react";

interface BudgetTarget {
  _id?: string;
  month: number;
  year: number;
  targetRevenue: number;
  targetExpenses?: number;
  notes?: string;
}

interface MonthlyData {
  month: number;
  label: string;
  target: number;
  actual: number;
  percentage: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BudgetTargetsPage() {
  const [targets, setTargets] = useState<BudgetTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editedTargets, setEditedTargets] = useState<Record<number, { revenue: string; expenses: string }>>({});
  const [monthlyActuals, setMonthlyActuals] = useState<MonthlyData[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch budget targets
      const targetsRes = await fetch(`/api/billing/budget?year=${selectedYear}`);
      const targetsData = await targetsRes.json();
      setTargets(targetsData.targets || []);

      // Initialize edited targets
      const edited: Record<number, { revenue: string; expenses: string }> = {};
      (targetsData.targets || []).forEach((t: BudgetTarget) => {
        edited[t.month] = {
          revenue: t.targetRevenue?.toString() || "",
          expenses: t.targetExpenses?.toString() || "",
        };
      });
      setEditedTargets(edited);

      // Fetch analytics for actuals
      const analyticsRes = await fetch(`/api/billing/analytics?months=12&year=${selectedYear}`);
      const analyticsData = await analyticsRes.json();
      
      // Map monthly data
      const monthlyData: MonthlyData[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthRevenue = analyticsData.monthlyRevenue?.find(
          (m: { month: number; year: number }) => m.month === month && m.year === selectedYear
        );
        const target = targetsData.targets?.find(
          (t: BudgetTarget) => t.month === month
        );
        
        const actual = monthRevenue?.totalRevenue || 0;
        const targetAmount = target?.targetRevenue || 0;
        
        monthlyData.push({
          month,
          label: SHORT_MONTHS[month - 1],
          target: targetAmount,
          actual,
          percentage: targetAmount > 0 ? Math.round((actual / targetAmount) * 100) : 0,
        });
      }
      setMonthlyActuals(monthlyData);
    } catch (error) {
      console.error("Failed to fetch budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (month: number, field: "revenue" | "expenses", value: string) => {
    setEditedTargets((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value,
      },
    }));
  };

  const saveAllTargets = async () => {
    setSaving(true);
    try {
      const targetsToSave = Object.entries(editedTargets)
        .filter(([_, values]) => values.revenue)
        .map(([month, values]) => ({
          month: parseInt(month),
          targetRevenue: parseFloat(values.revenue) || 0,
          targetExpenses: values.expenses ? parseFloat(values.expenses) : undefined,
        }));

      const res = await fetch("/api/billing/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          targets: targetsToSave,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to save targets:", error);
    } finally {
      setSaving(false);
    }
  };

  const applyToAllMonths = (revenue: string) => {
    const newTargets: Record<number, { revenue: string; expenses: string }> = {};
    for (let month = 1; month <= 12; month++) {
      newTargets[month] = {
        revenue,
        expenses: editedTargets[month]?.expenses || "",
      };
    }
    setEditedTargets(newTargets);
  };

  // Calculate totals
  const totalTarget = Object.values(editedTargets).reduce(
    (sum, t) => sum + (parseFloat(t.revenue) || 0),
    0
  );
  const totalActual = monthlyActuals.reduce((sum, m) => sum + m.actual, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Budget Targets</h1>
            <p className="text-sm text-slate-500 mt-1">Set monthly revenue targets and track progress</p>
          </div>
          <button
            onClick={saveAllTargets}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Targets
          </button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-slate-900">Year {selectedYear}</span>
          </div>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Yearly Progress</h3>
            <p className="text-brand-100">
              ₹{totalActual.toLocaleString()} of ₹{totalTarget.toLocaleString()} target
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-3xl font-bold">{overallProgress}%</span>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Quick Apply */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-3">Quick Apply</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">Set all months to:</span>
          {[50000, 100000, 150000, 200000].map((amount) => (
            <button
              key={amount}
              onClick={() => applyToAllMonths(amount.toString())}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              ₹{amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Targets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MONTH_NAMES.map((monthName, index) => {
          const month = index + 1;
          const monthData = monthlyActuals.find((m) => m.month === month);
          const currentTarget = editedTargets[month]?.revenue || "";
          const isCurrentMonth = month === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear();
          const isPastMonth = selectedYear < new Date().getFullYear() || 
            (selectedYear === new Date().getFullYear() && month < new Date().getMonth() + 1);

          return (
            <div
              key={month}
              className={`bg-white rounded-2xl border p-5 shadow-sm ${
                isCurrentMonth ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{monthName}</h4>
                {isCurrentMonth && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target Revenue</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={currentTarget}
                      onChange={(e) => handleTargetChange(month, "revenue", e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Progress bar for past/current months */}
                {(isPastMonth || isCurrentMonth) && currentTarget && parseFloat(currentTarget) > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">
                        Actual: ₹{(monthData?.actual || 0).toLocaleString()}
                      </span>
                      <span className={`font-medium ${
                        (monthData?.percentage || 0) >= 100 
                          ? "text-emerald-600" 
                          : (monthData?.percentage || 0) >= 75 
                          ? "text-brand-600"
                          : "text-amber-600"
                      }`}>
                        {monthData?.percentage || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (monthData?.percentage || 0) >= 100
                            ? "bg-emerald-500"
                            : (monthData?.percentage || 0) >= 75
                            ? "bg-brand-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, monthData?.percentage || 0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Overview Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Target vs Actual Overview</h3>
        <div className="h-48 flex items-end gap-2">
          {monthlyActuals.map((month) => {
            const target = parseFloat(editedTargets[month.month]?.revenue || "0");
            const maxValue = Math.max(target, month.actual, 1);
            const targetHeight = target > 0 ? (target / maxValue) * 100 : 0;
            const actualHeight = month.actual > 0 ? (month.actual / maxValue) * 100 : 0;

            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5" style={{ height: "160px" }}>
                  {/* Target bar */}
                  <div
                    className="flex-1 bg-slate-200 rounded-t transition-all"
                    style={{ height: `${targetHeight}%` }}
                    title={`Target: ₹${target.toLocaleString()}`}
                  />
                  {/* Actual bar */}
                  <div
                    className={`flex-1 rounded-t transition-all ${
                      month.percentage >= 100 ? "bg-emerald-500" : "bg-brand-500"
                    }`}
                    style={{ height: `${actualHeight}%` }}
                    title={`Actual: ₹${month.actual.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-slate-500">{month.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-200 rounded" />
            <span className="text-slate-600">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand-500 rounded" />
            <span className="text-slate-600">Actual</span>
          </div>
        </div>
      </div>
    </div>
  );
}
