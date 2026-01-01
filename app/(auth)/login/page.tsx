"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Calendar,
  Pill,
  Receipt,
  BarChart3,
  Users,
  Shield,
  ExternalLink,
  Mail,
  Scale,
  AlertTriangle,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Patient Visit Management",
    description: "Track daily OPD visits with token system and status updates",
  },
  {
    icon: Pill,
    title: "Smart Prescription Writer",
    description: "Quick medication entry with auto-suggestions and templates",
  },
  {
    icon: Receipt,
    title: "Digital Receipts & Billing",
    description: "Generate professional receipts with QR sharing",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track revenue, expenses, and clinic performance",
  },
  {
    icon: Users,
    title: "Multi-User Support",
    description: "Doctor and front desk roles with secure access",
  },
  {
    icon: Shield,
    title: "Open Source & Secure",
    description: "AGPL-3.0 licensed, self-hostable, your data stays yours",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Panel - Product Information */}
          <div className="hidden lg:block">
            {/* Hero Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/platanist_clinic_desk_minimal.png"
                    alt="Clinic Desk"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Clinic Desk
                  </h1>
                  <p className="text-brand-600 dark:text-brand-400 font-medium">
                    by Platanist
                  </p>
                </div>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                A modern, open-source OPD management system designed for small
                clinics. Streamline your daily workflow with smart tools for
                visits, prescriptions, and billing.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                >
                  <feature.icon className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/50 dark:to-brand-900/30 rounded-xl p-5 border border-brand-200 dark:border-brand-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Don&apos;t have an account?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Get started with Clinic Desk for your practice. We&apos;ll help you
                set up and get running.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://platanist.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  Visit platanist.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <a
                  href="mailto:anzar@platanist.com"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  anzar@platanist.com
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-20">
            {/* Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
                  <Image
                    src="/platanist_clinic_desk_minimal.png"
                    alt="Clinic Desk by Platanist"
                    width={56}
                    height={56}
                    className="rounded-lg"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white">Clinic Desk</h1>
                <p className="text-brand-200 text-sm mt-1">by Platanist</p>
              </div>

              {/* Form */}
              <div className="p-8">
                <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                  Sign in to your clinic portal
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="doctor@clinic.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                {/* Mobile-only: Account creation info */}
                <div className="lg:hidden mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-3">
                    Need an account?
                  </p>
                  <div className="flex flex-col gap-2 text-center">
                    <a
                      href="https://platanist.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400"
                    >
                      Visit platanist.com
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="mailto:anzar@platanist.com"
                      className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      anzar@platanist.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Link
                href="/legal/license"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                License
              </Link>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Link
                href="/legal/disclaimer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Clinic Desk by Platanist</p>
          <p className="flex items-center gap-1">
            <span>Platanist is the AI world of Anzar.</span>
            <span className="inline-flex items-center gap-0.5">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by Abdullah Anzar
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
