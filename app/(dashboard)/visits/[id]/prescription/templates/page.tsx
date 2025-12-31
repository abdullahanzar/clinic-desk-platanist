import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TemplatesManager from "@/components/prescriptions/templates-manager";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  // Only doctors can manage templates
  if (session.role !== "doctor") {
    redirect("/visits");
  }

  const { id } = await params;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/visits/${id}/prescription`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Prescription
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Prescription Templates
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your saved medications, advice templates, and diagnoses for quick access while writing prescriptions.
        </p>
      </div>

      <TemplatesManager />
    </div>
  );
}
