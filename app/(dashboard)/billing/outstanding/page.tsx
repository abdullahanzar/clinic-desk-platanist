"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  Check,
  Loader2,
  ChevronRight,
  Filter,
  CheckSquare,
  XSquare
} from "lucide-react";
import { formatDateIndian } from "@/lib/utils/date";
import type { PaymentMode } from "@/types";

interface OutstandingReceipt {
  _id: string;
  receiptNumber: string;
  patientSnapshot: {
    name: string;
    phone?: string;
  };
  totalAmount: number;
  receiptDate: string;
  daysOverdue: number;
}

interface OutstandingData {
  receipts: OutstandingReceipt[];
  summary: {
    totalCount: number;
    totalPending: number;
    oldestReceiptDate: string | null;
    ageGroups: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      older: number;
    };
  };
}

export default function OutstandingPaymentsPage() {
  const router = useRouter();
  const [data, setData] = useState<OutstandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchOutstanding();
  }, [sortBy]);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/outstanding?sortBy=${sortBy}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch outstanding receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (data) {
      setSelectedIds(data.receipts.map((r) => r._id));
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const markSelectedAsPaid = async () => {
    if (selectedIds.length === 0) return;

    setMarkingPaid(true);
    try {
      const res = await fetch("/api/billing/outstanding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds: selectedIds, paymentMode }),
      });

      if (res.ok) {
        await fetchOutstanding();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    } finally {
      setMarkingPaid(false);
    }
  };

  const getOverdueColor = (days: number) => {
    if (days === 0) return "text-slate-600 bg-slate-100";
    if (days <= 7) return "text-amber-700 bg-amber-100";
    if (days <= 30) return "text-orange-700 bg-orange-100";
    return "text-red-700 bg-red-100";
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
        <p className="text-slate-500">Failed to load outstanding payments</p>
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Outstanding Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Track and collect pending payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-amber-600">Total Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">₹{data.summary.totalPending.toLocaleString()}</p>
          <p className="text-xs text-amber-600 mt-1">{data.summary.totalCount} receipts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Today</p>
          <p className="text-2xl font-bold text-slate-700">{data.summary.ageGroups.today}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">This Week</p>
          <p className="text-2xl font-bold text-amber-600">{data.summary.ageGroups.thisWeek}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Older (30+ days)</p>
          <p className="text-2xl font-bold text-red-600">{data.summary.ageGroups.older}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {data.receipts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
              >
                <CheckSquare className="w-4 h-4" />
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
              >
                <XSquare className="w-4 h-4" />
                Deselect
              </button>
              {selectedIds.length > 0 && (
                <span className="text-sm text-brand-600 font-medium">
                  {selectedIds.length} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="patient">Sort by Patient</option>
                </select>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    onClick={markSelectedAsPaid}
                    disabled={markingPaid}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {markingPaid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Mark Paid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipts List */}
      {data.receipts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</h3>
          <p className="text-slate-500">No outstanding payments at the moment.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {data.receipts.map((receipt) => (
              <div
                key={receipt._id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  selectedIds.includes(receipt._id)
                    ? "border-brand-500 ring-2 ring-brand-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(receipt._id)}
                    onChange={() => toggleSelect(receipt._id)}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{receipt.patientSnapshot.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{receipt.receiptNumber}</p>
                      </div>
                      <p className="font-bold text-lg text-slate-900">₹{receipt.totalAmount}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        {formatDateIndian(new Date(receipt.receiptDate))}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getOverdueColor(receipt.daysOverdue)}`}>
                        {receipt.daysOverdue === 0 ? "Today" : `${receipt.daysOverdue} days`}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/receipts/${receipt._id}`}
                    className="p-2 text-slate-400 hover:text-brand-600"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.receipts.length && data.receipts.length > 0}
                      onChange={() =>
                        selectedIds.length === data.receipts.length ? deselectAll() : selectAll()
                      }
                      className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.receipts.map((receipt) => (
                  <tr
                    key={receipt._id}
                    className={`hover:bg-slate-50 transition-colors ${
                      selectedIds.includes(receipt._id) ? "bg-brand-50" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(receipt._id)}
                        onChange={() => toggleSelect(receipt._id)}
                        className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-slate-900">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{receipt.patientSnapshot.name}</p>
                      {receipt.patientSnapshot.phone && (
                        <p className="text-sm text-slate-500">{receipt.patientSnapshot.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDateIndian(new Date(receipt.receiptDate))}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOverdueColor(receipt.daysOverdue)}`}>
                        {receipt.daysOverdue === 0 ? "Today" : `${receipt.daysOverdue} days`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      ₹{receipt.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/receipts/${receipt._id}`}
                        className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
