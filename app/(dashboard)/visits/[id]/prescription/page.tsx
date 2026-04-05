import { getSession } from "@/lib/auth/session";
import { getDb, visits as visitsTable, prescriptions } from "@/lib/db/collections";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PrescriptionPageClient from "./prescription-client";

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  // Only doctors can write prescriptions
  if (session.role !== "doctor") {
    redirect("/visits");
  }

  const { id } = await params;

  const db = getDb();

  const visit = db.select().from(visitsTable)
    .where(and(eq(visitsTable.id, id), eq(visitsTable.clinicId, session.clinicId)))
    .get();

  if (!visit) {
    notFound();
  }

  const existingPrescription = db.select().from(prescriptions).where(eq(prescriptions.visitId, visit.id)).get();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/visits/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Visit
      </Link>

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {existingPrescription ? "Edit Prescription" : "Write Prescription"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Patient: <span className="font-medium text-slate-700">{visit.patientName}</span>
          {visit.patientAge && ` • ${visit.patientAge} years`}
          {visit.patientGender && ` • ${visit.patientGender}`}
        </p>
      </div>

      {/* Client component with sidebar layout */}
      <PrescriptionPageClient
        visitId={id}
        existingPrescription={
          existingPrescription
            ? {
                id: existingPrescription.id,
                diagnosis: existingPrescription.diagnosis ?? undefined,
                chiefComplaints: existingPrescription.chiefComplaints ?? undefined,
                medications: existingPrescription.medications,
                advice: existingPrescription.advice ?? undefined,
                followUpDate: existingPrescription.followUpDate ?? undefined,
                status: existingPrescription.status,
              }
            : undefined
        }
      />
    </div>
  );
}
