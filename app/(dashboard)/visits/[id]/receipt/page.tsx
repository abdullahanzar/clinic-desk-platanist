import { getSession } from "@/lib/auth/session";
import { getVisitsCollection, getPrescriptionsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
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

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const visits = await getVisitsCollection();
  const prescriptions = await getPrescriptionsCollection();

  const visit = await visits.findOne({
    _id: new ObjectId(id),
    clinicId: new ObjectId(session.clinicId),
  });

  if (!visit) {
    notFound();
  }

  // Fetch prescription if exists
  const prescription = await prescriptions.findOne({ visitId: visit._id });

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
          Patient: <span className="font-medium text-slate-700">{visit.patient.name}</span>
        </p>
      </div>

      <ReceiptForm
        visitId={id}
        patientName={visit.patient.name}
        patientPhone={visit.patient.phone}
        prescriptionData={prescription ? {
          diagnosis: prescription.diagnosis,
          advice: prescription.advice,
        } : undefined}
      />
    </div>
  );
}
