import Link from "next/link";
import { Scale, ExternalLink, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "License | Clinic Desk by Platanist",
  description: "Open source license information for Clinic Desk by Platanist",
};

export default function LicensePage() {
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
          <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Scale className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            License
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Open Source Software
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Clinic Desk by Platanist is open-source software licensed under the{" "}
            <strong className="text-slate-900 dark:text-slate-200">
              GNU Affero General Public License v3.0 (AGPL-3.0)
            </strong>.
          </p>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            What this means
          </h3>

          <ul className="text-slate-600 dark:text-slate-400 space-y-2 mb-6 list-disc list-inside">
            <li>
              You are free to use, modify, and distribute this software
            </li>
            <li>
              If you deploy a modified version of this software over a network,
              you must make your source code available to users
            </li>
            <li>
              Any modifications must also be licensed under AGPL-3.0
            </li>
            <li>
              The software is provided without warranty
            </li>
          </ul>

          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 mb-3">
            Full License Text
          </h3>

          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The complete license text is included in the source repository.
          </p>

          <a
            href="https://github.com/abdullahanzar/clinic-desk-platanist/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
          >
            View full AGPL-3.0 license
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
