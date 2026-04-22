import Image from "next/image";

interface RouteLoadingScreenProps {
  compact?: boolean;
  title?: string;
  message?: string;
}

export function RouteLoadingScreen({
  compact = false,
  title = "Preparing your workspace",
  message = "Loading clinic data, syncing the next screen, and getting everything ready.",
}: RouteLoadingScreenProps) {
  const logoSizeClass = compact ? "h-20 w-20" : "h-28 w-28";
  const shellClass = compact ? "min-h-[60vh]" : "min-h-screen";
  const cardPaddingClass = compact ? "px-6 py-7" : "px-8 py-8 sm:px-10 sm:py-10";

  return (
    <div
      className={`relative flex w-full ${shellClass} items-center justify-center overflow-hidden bg-linear-to-br from-brand-50 via-white to-brand-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950`}
    >
      <div className="absolute inset-0 opacity-70 dark:opacity-100">
        <div className="absolute left-[-8rem] top-[-6rem] h-56 w-56 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
        <div className="absolute bottom-[-7rem] right-[-6rem] h-72 w-72 rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-400/10" />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-linear-to-r from-transparent via-brand-300/40 to-transparent dark:via-brand-700/40" />
      </div>

      <div className={`relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 ${cardPaddingClass} shadow-2xl shadow-brand-900/10 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-black/30`}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-brand-300/30 dark:bg-brand-500/20" />
            <div className="absolute inset-[-14px] rounded-full border border-brand-200/80 dark:border-brand-700/40" />
            <div className={`relative ${logoSizeClass} overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-lg shadow-brand-900/10 dark:border-slate-700 dark:bg-slate-950`}>
              <div className="absolute inset-0 bg-linear-to-br from-brand-100/80 via-white to-accent-100/60 dark:from-brand-950/70 dark:via-slate-950 dark:to-slate-900" />
              <Image
                src="/platanist_clinic_desk_minimal.png"
                alt="Clinic Desk"
                fill
                priority
                className="relative z-10 object-contain p-4"
              />
            </div>
          </div>

          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 dark:bg-brand-400" />
            Clinic Desk
          </span>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
            {message}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s] dark:bg-brand-400" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s] dark:bg-brand-400" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 dark:bg-brand-400" />
          </div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2 text-left text-[11px] text-slate-500 dark:text-slate-400">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              Auth
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              Data
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              UI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}