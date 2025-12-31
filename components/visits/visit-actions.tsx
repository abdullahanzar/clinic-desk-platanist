"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole, VisitStatus } from "@/types";
import { Stethoscope, FileText, PenLine, Receipt, XCircle, Zap } from "lucide-react";

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

  if (status === "cancelled" || status === "completed") {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
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

        {/* Receipt generation - both roles, during consultation OR doctor with prescription */}
        {(status === "in-consultation" || (role === "doctor" && hasPrescription)) && (
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
            className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-medium disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
            Cancel Visit
          </button>
        )}
      </div>
    </div>
  );
}
