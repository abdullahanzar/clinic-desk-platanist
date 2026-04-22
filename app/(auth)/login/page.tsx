"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  Eye,
  EyeOff,
  UserPlus,
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

const DEMO_EMAIL = "doctor@demo.com";
const DEMO_PASSWORD = "doctor123";
const MIN_LOADING_MS = 700;
const loginFaqs = [
  {
    question: "Who is Clinic Desk built for?",
    answer:
      "Clinic Desk is built for doctors, small clinics, and front-desk staff who need one OPD workflow for visits, prescriptions, receipts, and billing.",
  },
  {
    question: "Can clinics try the software before creating an account?",
    answer:
      "Yes. The login page includes a demo doctor account so clinics can inspect the workflow before signing up for a new workspace.",
  },
  {
    question: "Is Clinic Desk self-hosted and open source?",
    answer:
      "Yes. Clinic Desk is open source under AGPL-3.0 and can be deployed by clinics that want ownership of their software and data.",
  },
] as const;

const loginStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Clinic Login for Doctors and Staff",
      description:
        "Sign in to Clinic Desk to manage OPD visits, digital prescriptions, billing, receipts, and clinic staff workflows.",
      url: "/login",
    },
    {
      "@type": "FAQPage",
      mainEntity: loginFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/register");
  }, [router]);

  const loginWithCredentials = async (nextEmail: string, nextPassword: string) => {
    setError("");
    setLoading(true);
    const loadingDelay = new Promise((resolve) => {
      window.setTimeout(resolve, MIN_LOADING_MS);
    });

    try {
      const resPromise = fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });

      const [res] = await Promise.all([resPromise, loadingDelay]);

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_VERIFICATION_REQUIRED" && data.signupId && data.email) {
          router.push(
            `/register/verify?signupId=${encodeURIComponent(data.signupId)}&email=${encodeURIComponent(data.email)}`
          );
          return;
        }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await loginWithCredentials(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-brand-50 via-white to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(loginStructuredData),
        }}
      />
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
            <div className="bg-linear-to-r from-brand-50 to-brand-100 dark:from-brand-950/50 dark:to-brand-900/30 rounded-xl p-5 border border-brand-200 dark:border-brand-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Don&apos;t have an account?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Create a doctor account for a new clinic, verify the email address,
                and unlock the dashboard in one flow.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 transition-colors"
                >
                  Start doctor signup
                </Link>
                <span className="text-slate-300 dark:text-slate-600">|</span>
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
              <div className="bg-linear-to-r from-brand-600 to-brand-700 px-8 py-8 text-center">
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
                <div className="mb-5 flex items-center justify-between gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/60"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Sign up
                  </Link>
                </div>

                <div className="mb-6 space-y-3 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Sign in to your clinic portal
                  </p>
                </div>

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
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
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

                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/60"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create a doctor account
                  </Link>

                  <div className="rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-3 text-left dark:border-brand-800 dark:bg-brand-950/30">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Just exploring?
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Continue with the demo doctor account to check the system first.
                    </p>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={loading}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-700 dark:bg-slate-900 dark:text-brand-200 dark:hover:bg-brand-950/70"
                    >
                      <Users className="h-4 w-4" />
                      Continue with demo account
                    </button>
                    <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                      {DEMO_EMAIL} / {DEMO_PASSWORD}
                    </p>
                  </div>
                </form>

                {/* Mobile-only: Account creation info */}
                <div className="lg:hidden mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-3">
                    Need an account?
                  </p>
                  <div className="flex flex-col gap-2 text-center">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/60"
                    >
                      <UserPlus className="h-4 w-4" />
                      Start doctor signup
                    </Link>
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

      <div className="px-4 pb-8 sm:pb-10">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                Clinic software access
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                A discoverable entry point for modern clinic operations
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                This login page is the front door for Clinic Desk, an open-source OPD
                management system for doctors, clinic owners, and reception teams.
                Teams use it to handle patient visits, write prescriptions faster,
                issue digital receipts, and keep staff workflows in one secure clinic portal.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Clinics evaluating self-hosted medical software can review the product,
                test the demo account, and create a doctor-owned workspace directly from
                this page. That makes the route useful both for returning staff and for
                search users looking for practical clinic management tools.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-3xl border border-brand-100 bg-brand-50/80 p-5 dark:border-brand-900/60 dark:bg-brand-950/30">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  OPD workflow
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Track daily visits, maintain status-driven queues, and keep consultations moving without separate tools.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Prescriptions and billing
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Generate prescriptions, advice, receipts, and billing records from a single clinic system.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Open source deployment
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Run the software on the web or inspect the open-source codebase before rolling it out for your clinic.
                </p>
              </article>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {loginFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
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
