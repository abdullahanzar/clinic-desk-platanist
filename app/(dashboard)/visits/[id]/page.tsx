import { getSession } from "@/lib/auth/session";
import {
  getVisitsCollection,
  getPrescriptionsCollection,
  getReceiptsCollection,
} from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { formatDateIndian, formatTime } from "@/lib/utils/date";
import { VisitActions } from "@/components/visits/visit-actions";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Pill, Receipt } from "lucide-react";

export default async function VisitDetailPage({
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
  const receipts = await getReceiptsCollection();

  const visit = await visits.findOne({
    _id: new ObjectId(id),
    clinicId: new ObjectId(session.clinicId),
  });

  if (!visit) {
    notFound();
  }

  const prescription = await prescriptions.findOne({ visitId: visit._id });
  const visitReceipts = await receipts
    .find({ visitId: visit._id })
    .sort({ createdAt: -1 })
    .toArray();

  const statusConfig = {
    waiting: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500", label: "Waiting" },
    "in-consultation": { bg: "bg-brand-100", text: "text-brand-800", dot: "bg-brand-500", label: "In Consultation" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", label: "Completed" },
    cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Cancelled" },
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/visits"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Queue
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 text-xl sm:text-2xl font-bold rounded-2xl flex items-center justify-center">
              {visit.tokenNumber}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {visit.patient.name}
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">
                {visit.patient.phone}
                {visit.patient.age && ` • ${visit.patient.age} years`}
                {visit.patient.gender && ` • ${visit.patient.gender}`}
              </p>
            </div>
          </div>
          <span
            className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
              statusConfig[visit.status].bg
            } ${statusConfig[visit.status].text}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig[visit.status].dot}`} />
            {statusConfig[visit.status].label}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Visit Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-600" />
            Visit Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Date</p>
              <p className="font-medium text-slate-900">{formatDateIndian(visit.visitDate)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Time</p>
              <p className="font-medium text-slate-900">{formatTime(visit.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Reason for Visit</p>
              <p className="font-medium text-slate-900">{visit.visitReason}</p>
            </div>
          </div>
        </div>

        {/* Actions based on role and status */}
        <VisitActions
          visitId={id}
          status={visit.status}
          role={session.role}
          hasPrescription={!!prescription}
        />

        {/* Prescription */}
        {prescription && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-brand-600" />
                Prescription
              </h2>
              <span
                className={`self-start inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${
                  prescription.status === "finalized"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {prescription.status}
              </span>
            </div>

            {prescription.diagnosis && (
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Diagnosis</p>
                <p className="font-medium text-slate-900">{prescription.diagnosis}</p>
              </div>
            )}

            {prescription.medications.length > 0 && (
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide mb-2">Medications</p>
                <div className="space-y-2">
                  {prescription.medications.map((med, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100"
                    >
                      <p className="font-medium text-slate-900">{med.name}</p>
                      <p className="text-sm text-slate-600">
                        {med.dosage} • {med.duration}
                        {med.instructions && ` • ${med.instructions}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prescription.advice && (
              <div>
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Advice</p>
                <p className="font-medium text-slate-900">{prescription.advice}</p>
              </div>
            )}
          </div>
        )}

        {/* Receipts */}
        {visitReceipts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-600" />
              Receipts
            </h2>
            <div className="space-y-3">
              {visitReceipts.map((receipt) => (
                <Link
                  key={receipt._id.toString()}
                  href={`/receipts/${receipt._id.toString()}`}
                  className="block bg-slate-50 p-4 rounded-xl hover:bg-slate-100 hover:border-brand-200 border border-slate-100 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{receipt.receiptNumber}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateIndian(receipt.receiptDate)}
                      </p>
                    </div>
                    <p className="font-bold text-lg text-slate-900">
                      ₹{receipt.totalAmount}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
