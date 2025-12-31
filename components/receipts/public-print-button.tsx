"use client";

import { useState } from "react";
import { Printer, Loader2 } from "lucide-react";

interface PublicPrintButtonProps {
  receiptId: string;
  className?: string;
}

export function PublicPrintButton({ receiptId, className }: PublicPrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Fetch the PDF from public endpoint
      const response = await fetch(`/api/public/receipt/${receiptId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new tab for printing
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to generate PDF. The receipt may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={className ?? "flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Printer className="w-5 h-5" />
      )}
      Print
    </button>
  );
}
