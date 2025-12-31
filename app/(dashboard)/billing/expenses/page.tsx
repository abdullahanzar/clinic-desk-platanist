"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus,
  Wallet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit2,
  Trash2,
  X,
  Save,
  RefreshCcw
} from "lucide-react";
import type { ExpenseCategory, RecurringFrequency } from "@/types";

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  vendor?: string;
  invoiceNumber?: string;
  notes?: string;
}

interface ExpenseData {
  expenses: Expense[];
  summary: {
    total: number;
    count: number;
    byCategory: { category: string; total: number; count: number }[];
  };
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: "rent", label: "Rent", color: "bg-violet-500" },
  { value: "salary", label: "Salaries", color: "bg-blue-500" },
  { value: "supplies", label: "Supplies", color: "bg-emerald-500" },
  { value: "utilities", label: "Utilities", color: "bg-amber-500" },
  { value: "equipment", label: "Equipment", color: "bg-cyan-500" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500" },
  { value: "marketing", label: "Marketing", color: "bg-pink-500" },
  { value: "insurance", label: "Insurance", color: "bg-indigo-500" },
  { value: "taxes", label: "Taxes", color: "bg-red-500" },
  { value: "other", label: "Other", color: "bg-slate-500" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ExpensesPage() {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other" as ExpenseCategory,
    expenseDate: new Date().toISOString().split("T")[0],
    isRecurring: false,
    recurringFrequency: "monthly" as RecurringFrequency,
    vendor: "",
    invoiceNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, [selectedYear, selectedMonth]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/billing/expenses?year=${selectedYear}&month=${selectedMonth}`
      );
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
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

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "other",
      expenseDate: new Date().toISOString().split("T")[0],
      isRecurring: false,
      recurringFrequency: "monthly",
      vendor: "",
      invoiceNumber: "",
      notes: "",
    });
    setEditingExpense(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expenseDate: expense.expenseDate.split("T")[0],
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || "monthly",
      vendor: expense.vendor || "",
      invoiceNumber: expense.invoiceNumber || "",
      notes: expense.notes || "",
    });
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    setSubmitting(true);
    try {
      const url = editingExpense
        ? `/api/billing/expenses/${editingExpense._id}`
        : "/api/billing/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        await fetchExpenses();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/billing/expenses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_OPTIONS.find((c) => c.value === category)?.color || "bg-slate-500";
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
  };

  if (loading && !data) {
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Expense Tracking</h1>
            <p className="text-sm text-slate-500 mt-1">Track your clinic&apos;s expenses</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
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
            <Calendar className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-slate-900">
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
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-red-600" />
            <span className="text-xs text-red-600">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-700">₹{(data?.summary.total || 0).toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">{data?.summary.count || 0} transactions</p>
        </div>

        {data?.summary.byCategory.slice(0, 3).map((cat) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getCategoryColor(cat.category)}`} />
              <span className="text-xs text-slate-600">{getCategoryLabel(cat.category)}</span>
            </div>
            <p className="text-xl font-bold text-slate-700">₹{cat.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {data?.summary.byCategory && data.summary.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Expense by Category</h3>
          <div className="space-y-3">
            {data.summary.byCategory.map((cat) => {
              const percentage = data.summary.total > 0
                ? Math.round((cat.total / data.summary.total) * 100)
                : 0;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {getCategoryLabel(cat.category)}
                    </span>
                    <span className="text-sm text-slate-500">
                      ₹{cat.total.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getCategoryColor(cat.category)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses List */}
      {!data || data.expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Expenses Yet</h3>
          <p className="text-slate-500 mb-4">Start tracking your clinic expenses</p>
          <button
            onClick={openAddModal}
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            Add your first expense →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {new Date(expense.expenseDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{expense.description}</p>
                        {expense.vendor && (
                          <p className="text-xs text-slate-500">{expense.vendor}</p>
                        )}
                        {expense.isRecurring && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <RefreshCcw className="w-3 h-3" />
                            {expense.recurringFrequency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(expense.category)}`}>
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="e.g., Monthly rent payment"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor/Payee
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="e.g., Landlord name"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">This is a recurring expense</span>
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingExpense ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
