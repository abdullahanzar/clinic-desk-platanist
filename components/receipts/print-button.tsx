"use client";

import { useState } from "react";
import { Printer, Loader2, Download } from "lucide-react";

interface PrintButtonProps {
  receiptId?: string;
  className?: string;
}

export function PrintButton({ receiptId, className }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);

  // If no receiptId provided, fall back to browser print
  const handleBrowserPrint = () => {
    window.print();
  };

  const handlePrint = async () => {
    if (!receiptId) {
      handleBrowserPrint();
      return;
    }

    setLoading(true);
    try {
      // Fetch the PDF from server
      const response = await fetch(`/api/receipts/${receiptId}/pdf`);
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
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receiptId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Simple button without download for public/fallback use
  if (!receiptId) {
    return (
      <button
        onClick={handleBrowserPrint}
        className={className ?? "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"}
      >
        <Printer className="w-5 h-5" />
        Print
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        disabled={loading}
        className={className ?? "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Printer className="w-5 h-5" />
        )}
        Print
      </button>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        title="Download PDF"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
