"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface AppBackButtonProps {
  defaultFallbackHref: string;
  className?: string;
  variant?: "default" | "inverse";
}

function getFallbackHref(pathname: string, defaultFallbackHref: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return defaultFallbackHref;
  }

  return `/${segments.slice(0, -1).join("/")}`;
}

export function AppBackButton({
  defaultFallbackHref,
  className = "",
  variant = "default",
}: AppBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleBack = () => {
    const hasInternalReferrer =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin);
    const hasHistory = typeof window !== "undefined" && window.history.length > 1;

    if (hasHistory && (hasInternalReferrer || document.referrer === "")) {
      router.back();
      return;
    }

    router.push(getFallbackHref(pathname, defaultFallbackHref));
  };

  const variantClasses =
    variant === "inverse"
      ? "border-slate-700/80 bg-slate-900/85 text-slate-100 hover:bg-slate-800"
      : "border-slate-200/80 bg-white/92 text-slate-700 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/92 dark:text-slate-200 dark:hover:bg-slate-900";

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={`no-print inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm backdrop-blur transition-colors ${variantClasses} ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>
  );
}