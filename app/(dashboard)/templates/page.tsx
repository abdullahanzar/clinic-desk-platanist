import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import TemplatesManager from "@/components/prescriptions/templates-manager";

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) return null;

  // Only doctors can manage templates
  if (session.role !== "doctor") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto">
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
