import { getSession } from "@/lib/auth/session";
import { getVisitsCollection, getPrescriptionsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { notFound, redirect } from "next/navigation";
import PrescriptionForm from "@/components/prescriptions/prescription-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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

  const existingPrescription = await prescriptions.findOne({ visitId: visit._id });

  return (
    <div className="max-w-3xl mx-auto">
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {existingPrescription ? "Edit Prescription" : "Write Prescription"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Patient: <span className="font-medium text-slate-700">{visit.patient.name}</span>
          {visit.patient.age && ` • ${visit.patient.age} years`}
        </p>
      </div>

      <PrescriptionForm
        visitId={id}
        existingPrescription={
          existingPrescription
            ? {
                _id: existingPrescription._id.toString(),
                diagnosis: existingPrescription.diagnosis,
                chiefComplaints: existingPrescription.chiefComplaints,
                medications: existingPrescription.medications,
                advice: existingPrescription.advice,
                followUpDate: existingPrescription.followUpDate?.toISOString(),
                status: existingPrescription.status,
              }
            : undefined
        }
      />
    </div>
  );
}
