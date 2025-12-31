"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LineItem, PaymentMode } from "@/types";
import { FileText, Plus, X, Tag, CreditCard, Loader2, Receipt, Pill } from "lucide-react";

interface PrescriptionData {
  diagnosis?: string;
  advice?: string;
}

interface ReceiptFormProps {
  visitId: string;
  patientName: string;
  patientPhone?: string;
  prescriptionData?: PrescriptionData;
}

export default function ReceiptForm({
  visitId,
  patientName,
  patientPhone,
  prescriptionData,
}: ReceiptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Consultation Fee", amount: 0 },
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");
  const [isPaid, setIsPaid] = useState(true);
  const [includePrescription, setIncludePrescription] = useState(!!prescriptionData);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    if (field === "amount") {
      updated[index] = { ...updated[index], amount: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], description: String(value) };
    }
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // Filter out empty line items
    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.amount > 0
    );

    if (validItems.length === 0) {
      setError("Add at least one line item with amount");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          patientName,
          patientPhone,
          lineItems: validItems,
          discountAmount,
          discountReason: discountReason || undefined,
          paymentMode: paymentMode || undefined,
          isPaid,
          prescriptionSnapshot: includePrescription && prescriptionData ? {
            diagnosis: prescriptionData.diagnosis,
            advice: prescriptionData.advice,
          } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create receipt");
        return;
      }

      router.push(`/receipts/${data.receipt._id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 dark:border-red-900 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Prescription Info - if available */}
      {prescriptionData && (prescriptionData.diagnosis || prescriptionData.advice) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-brand-600" />
              Prescription Details
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePrescription}
                onChange={(e) => setIncludePrescription(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Include in receipt</span>
            </label>
          </div>
          <div className="space-y-3 text-sm">
            {prescriptionData.diagnosis && (
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Diagnosis</p>
                <p className="text-slate-800">{prescriptionData.diagnosis}</p>
              </div>
            )}
            {prescriptionData.advice && (
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Advice</p>
                <p className="text-slate-800">{prescriptionData.advice}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Items
          </h3>
          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="flex gap-2 sm:gap-3 items-center">
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateLineItem(index, "description", e.target.value)
                }
                placeholder="Description"
                className="flex-1 px-3 sm:px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm sm:text-base focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <div className="relative flex-shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  value={item.amount || ""}
                  onChange={(e) =>
                    updateLineItem(index, "amount", e.target.value)
                  }
                  placeholder="0"
                  className="w-24 sm:w-28 pl-7 pr-2 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm sm:text-base focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              {lineItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand-600" />
          Discount
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                ₹
              </span>
              <input
                type="number"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">
              Reason (optional)
            </label>
            <input
              type="text"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g., Senior citizen"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" />
          Payment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none bg-white"
            >
              <option value="">Select</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-slate-700 font-medium">Payment received</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium">₹{subtotal}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-medium">-₹{discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 pt-3 border-t border-slate-300">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium text-center"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              Generate Receipt
            </>
          )}
        </button>
      </div>
    </div>
  );
}
