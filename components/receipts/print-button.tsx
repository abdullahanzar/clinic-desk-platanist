"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  className?: string;
}

export function PrintButton({ className }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={className ?? "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"}
    >
      <Printer className="w-5 h-5" />
      Print
    </button>
  );
}
