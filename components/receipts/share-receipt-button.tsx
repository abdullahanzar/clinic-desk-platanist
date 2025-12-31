"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Loader2 } from "lucide-react";

interface ShareReceiptButtonProps {
  receiptId: string;
  isCurrentlyShared: boolean;
}

export function ShareReceiptButton({
  receiptId,
  isCurrentlyShared,
}: ShareReceiptButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(isCurrentlyShared);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setShared(true);
        setExpiresAt(new Date(data.expiresAt));
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shared-receipt/clear", {
        method: "POST",
      });
      if (res.ok) {
        setShared(false);
        setExpiresAt(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (shared) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="px-5 py-3 bg-brand-50 text-brand-800 font-medium rounded-xl flex items-center justify-center gap-2 border border-brand-200">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
          <span>Shared to Desk QR</span>
          {expiresAt && (
            <span className="text-sm opacity-75">
              (expires {expiresAt.toLocaleTimeString()})
            </span>
          )}
        </div>
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-4 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 font-medium"
        >
          Clear
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sharing...
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          Share to Desk QR
        </>
      )}
    </button>
  );
}
