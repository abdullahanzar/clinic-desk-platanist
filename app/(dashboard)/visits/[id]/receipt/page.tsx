import { getSession } from "@/lib/auth/session";
import { getDb, visits as visitsTable, prescriptions } from "@/lib/db/collections";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReceiptForm from "@/components/receipts/receipt-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function VisitReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;

  const db = getDb();

  const visit = db.select().from(visitsTable)
    .where(and(eq(visitsTable.id, id), eq(visitsTable.clinicId, session.clinicId)))
    .get();

  if (!visit) {
    notFound();
  }

  // Fetch prescription if exists
  const prescription = db.select().from(prescriptions).where(eq(prescriptions.visitId, visit.id)).get();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/visits/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Visit
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Generate Receipt</h1>
        <p className="text-sm text-slate-500 mt-1">
          Patient: <span className="font-medium text-slate-700">{visit.patientName}</span>
        </p>
      </div>

      <ReceiptForm
        visitId={id}
        patientName={visit.patientName}
        patientPhone={visit.patientPhone}
        prescriptionData={prescription ? {
          diagnosis: prescription.diagnosis ?? undefined,
          advice: prescription.advice ?? undefined,
        } : undefined}
      />
    </div>
  );
}
