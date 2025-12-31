"use client";

import Link from "next/link";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer
      className={`text-center text-xs text-slate-400 dark:text-slate-500 py-4 ${className}`}
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
        <span>Clinic Desk by Platanist</span>
        <span className="hidden sm:inline">·</span>
        <Link
          href="/legal/license"
          className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 decoration-slate-300 dark:decoration-slate-600 transition-colors"
        >
          Open Source (AGPL-3.0)
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link
          href="/legal/disclaimer"
          className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 decoration-slate-300 dark:decoration-slate-600 transition-colors"
        >
          Disclaimer
        </Link>
      </span>
    </footer>
  );
}
