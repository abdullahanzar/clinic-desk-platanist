"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole, VisitStatus } from "@/types";
import { Stethoscope, FileText, PenLine, Receipt, XCircle, Zap, Trash2, Loader2 } from "lucide-react";

interface VisitActionsProps {
  visitId: string;
  status: VisitStatus;
  role: UserRole;
  hasPrescription: boolean;
}

export function VisitActions({
  visitId,
  status,
  role,
  hasPrescription,
}: VisitActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateStatus = async (newStatus: VisitStatus) => {
    setLoading(true);
    try {
      await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/visits");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Determine if we should show the actions panel
  // Show for: waiting, in-consultation, and completed (for receipt generation)
  // Hide for: cancelled
  const showConsultationActions = status !== "cancelled" && status !== "completed";
  const canGenerateReceipt = status === "in-consultation" || status === "completed";

  // If cancelled, don't show anything
  if (status === "cancelled") {
    return null;
  }

  // If completed and no receipt generation capability, don't show actions
  if (status === "completed" && !canGenerateReceipt) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-brand-600" />
        Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        {/* Doctor actions */}
        {role === "doctor" && status === "waiting" && (
          <button
            onClick={() => updateStatus("in-consultation")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/20 font-medium disabled:opacity-50"
          >
            <Stethoscope className="w-5 h-5" />
            Start Consultation
          </button>
        )}

        {role === "doctor" && status === "in-consultation" && !hasPrescription && (
          <Link
            href={`/visits/${visitId}/prescription`}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/20 font-medium"
          >
            <FileText className="w-5 h-5" />
            Write Prescription
          </Link>
        )}

        {role === "doctor" && status === "in-consultation" && hasPrescription && (
          <Link
            href={`/visits/${visitId}/prescription`}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/20 font-medium"
          >
            <PenLine className="w-5 h-5" />
            Edit Prescription
          </Link>
        )}

        {/* Receipt generation - available during consultation and after completion */}
        {canGenerateReceipt && (
          <Link
            href={`/visits/${visitId}/receipt`}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all shadow-lg shadow-violet-500/20 font-medium"
          >
            <Receipt className="w-5 h-5" />
            Generate Receipt
          </Link>
        )}

        {/* Cancel - front desk only for waiting patients */}
        {role === "frontdesk" && status === "waiting" && (
          <button
            onClick={() => updateStatus("cancelled")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-100 transition-all font-medium disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
            Cancel Visit
          </button>
        )}

        {/* Delete - doctor only */}
        {role === "doctor" && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition-all font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Delete Visit
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Delete Visit?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  This will permanently delete this visit along with its prescription and receipts. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
