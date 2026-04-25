"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, RefreshCcw, ShieldCheck } from "lucide-react";

const DEFAULT_RESEND_COOLDOWN = 60;

export default function VerifySignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupId = searchParams.get("signupId") || "";
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!signupId) {
      setError("Missing signup reference. Start again from the register page.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signupId,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    if (!signupId) {
      setError("Missing signup reference. Start again from the register page.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch("/api/auth/signup/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.secondsRemaining === "number") {
          setCooldownSeconds(data.secondsRemaining);
        }
        setError(data.error || "Could not resend the verification code");
        return;
      }

      setCooldownSeconds(DEFAULT_RESEND_COOLDOWN);
      setMessage("A fresh verification code has been sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-50 via-white to-sky-100 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden rounded-4xl border border-white/70 bg-white/70 p-8 shadow-xl shadow-slate-900/5 backdrop-blur lg:block dark:border-slate-800/80 dark:bg-slate-950/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
              <ShieldCheck className="h-4 w-4" />
              Email verification required
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Finish setup with the code we emailed you.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              Enter the six-digit code from your inbox to create the clinic, activate the doctor account, and sign in automatically.
            </p>
            <div className="mt-8 rounded-3xl border border-slate-200/70 bg-white/85 p-5 dark:border-slate-800 dark:bg-slate-900/75">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Verification goes to</p>
              <p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">{email || "your doctor email address"}</p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-xl rounded-4xl border border-slate-200/70 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
                <MailCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Verify doctor email</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Use the code from your inbox. Access is granted only after verification succeeds.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="mt-8 space-y-5">
              {error ? (
                <div className="rounded-2xl border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {message}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Verification code</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-3xl font-semibold tracking-[0.4em] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                  placeholder="000000"
                />
              </label>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify and open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Didn&apos;t get the email?</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Check spam or request a fresh code. The newest code always replaces the previous one.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldownSeconds > 0}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                {cooldownSeconds > 0 ? `Resend available in ${cooldownSeconds}s` : "Send a new code"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                Back to register
              </Link>
              <Link href="/login" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                Sign in instead
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}