import Link from "next/link";
import { AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Disclaimer | Clinic Desk by Platanist",
  description: "Important disclaimer information for Clinic Desk by Platanist",
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to app
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Disclaimer
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Purpose of This Software
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Clinic Desk by Platanist is a{" "}
            <strong className="text-slate-900 dark:text-slate-200">
              clinic workflow and billing assistance tool only
            </strong>.
            It is not a medical device or electronic health record system.
          </p>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            This software is NOT:
          </h3>

          <ul className="text-slate-600 dark:text-slate-400 space-y-2 mb-6 list-disc list-inside">
            <li>A medical device</li>
            <li>An Electronic Health Record (EHR)</li>
            <li>A Hospital Management System (HMS)</li>
            <li>A source of medical advice, diagnosis, or treatment</li>
          </ul>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            Medical Responsibility
          </h3>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            All medical decisions, prescriptions, diagnoses, and patient
            interactions remain the{" "}
            <strong className="text-slate-900 dark:text-slate-200">
              sole responsibility of the licensed medical professional
            </strong>{" "}
            using this software.
          </p>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            No Warranty
          </h3>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This software is provided "AS IS", without warranty of any kind.
            Use of this software is entirely at the user's own risk.
          </p>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            Full Disclaimer
          </h3>

          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The complete disclaimer is included in the source repository.
          </p>

          <a
            href="https://github.com/AaronSiddiqui/opd-platanist/blob/main/DISCLAIMER.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
          >
            View full disclaimer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
