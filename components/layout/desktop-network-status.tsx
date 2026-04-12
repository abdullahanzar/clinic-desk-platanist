"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Link as LinkIcon, RefreshCw, Wifi } from "lucide-react";

const REFRESH_INTERVAL_MS = 30000;

export function DesktopNetworkStatus() {
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [status, setStatus] = useState<ClinicDeskDesktopNetworkStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyState, setCopyState] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const desktopApi = window.clinicDeskDesktop;
    if (!desktopApi?.getNetworkStatus) {
      setIsLoading(false);
      return () => undefined;
    }

    setIsDesktopApp(true);

    const loadStatus = async (refresh = false) => {
      if (!isMounted) {
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      }

      try {
        const nextStatus = await desktopApi.getNetworkStatus();
        if (!isMounted) {
          return;
        }

        setStatus(nextStatus);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadStatus();

    const intervalId = window.setInterval(() => {
      void loadStatus(true);
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadStatus(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!isDesktopApp) {
    return null;
  }

  const handleRefresh = async () => {
    if (!window.clinicDeskDesktop?.getNetworkStatus) {
      return;
    }

    setIsRefreshing(true);

    try {
      const nextStatus = await window.clinicDeskDesktop.getNetworkStatus();
      setStatus(nextStatus);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopyState(url);
    window.setTimeout(() => {
      setCopyState((currentUrl) => (currentUrl === url ? null : currentUrl));
    }, 2000);
  };

  const accentClasses = status?.noticeLevel === "success"
    ? "border-teal-200 bg-teal-50/80 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
    : "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
  const pillClasses = status?.noticeLevel === "success"
    ? "border-teal-200 bg-white/80 text-teal-700 dark:border-teal-800 dark:bg-teal-950/80 dark:text-teal-300"
    : "border-amber-200 bg-white/80 text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300";

  return (
    <section className={`mb-4 sm:mb-6 rounded-2xl border shadow-sm ${accentClasses}`}>
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${pillClasses}`}>
              <Wifi className="h-3.5 w-3.5" />
              <span>Local Network Access</span>
            </span>
            {status?.wifiDetected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
                <Check className="h-3.5 w-3.5" />
                <span>Wi-Fi detected</span>
              </span>
            )}
            {status && !status.wifiDetected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Wi-Fi not detected</span>
              </span>
            )}
          </div>

          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Open Clinic Desk from another device
          </h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {isLoading && !status ? "Checking the desktop network address..." : status?.message}
          </p>

          {status?.primaryUrl && (
            <div className="mt-4 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Primary URL
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <LinkIcon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="truncate">{status.primaryUrl}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy(status.primaryUrl!)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  {copyState === status.primaryUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copyState === status.primaryUrl ? "Copied" : "Copy URL"}</span>
                </button>
              </div>
            </div>
          )}

          {status && status.accessUrls.length > 1 && (
            <div className="mt-3 space-y-2 rounded-xl border border-white/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Other detected addresses
              </p>
              {status.accessUrls.slice(1).map((entry) => (
                <div key={entry.url} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{entry.url}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.interfaceName}{entry.isWifi ? " • Wi-Fi" : " • LAN"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {status && !status.wifiDetected && (
            <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-100/70 p-3 text-sm text-amber-900 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-100">
              Use the URL only from devices on the same local router or hotspot. Public internet access is not configured here, and ISP NAT gateways can prevent direct inbound access even when an IP is visible.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </div>
    </section>
  );
}