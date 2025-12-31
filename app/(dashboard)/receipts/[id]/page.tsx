import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { formatDateIndian } from "@/lib/utils/date";
import { ShareReceiptButton } from "@/components/receipts/share-receipt-button";
import { PrintButton } from "@/components/receipts/print-button";
import Link from "next/link";
import { ChevronLeft, Check, Clock } from "lucide-react";

export default async function ReceiptDetailPage({
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

  const receipts = await getReceiptsCollection();
  const clinics = await getClinicsCollection();

  const receipt = await receipts.findOne({
    _id: new ObjectId(id),
    clinicId: new ObjectId(session.clinicId),
  });

  if (!receipt) {
    notFound();
  }

  const clinic = await clinics.findOne({ _id: new ObjectId(session.clinicId) });

  const isCurrentlyShared =
    clinic?.currentSharedReceiptId?.toString() === receipt._id.toString();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href="/receipts"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Receipts
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Receipt {receipt.receiptNumber}
          </h1>
          <p className="text-sm text-slate-500">{formatDateIndian(receipt.receiptDate)}</p>
        </div>
        <span
          className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
            receipt.isPaid
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {receipt.isPaid ? (
            <><Check className="w-4 h-4" /> Paid</>
          ) : (
            <><Clock className="w-4 h-4" /> Unpaid</>
          )}
        </span>
      </div>

      {/* Receipt Content */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">
        {/* Clinic Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-5 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold">{clinic?.name}</h2>
          {clinic?.address && (
            <p className="text-brand-100 text-sm mt-1">
              {clinic.address.line1}, {clinic.address.city}
            </p>
          )}
          {clinic?.phone && (
            <p className="text-brand-100 text-sm">Ph: {clinic.phone}</p>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {/* Patient Info */}
          <div className="mb-6 pb-4 border-b border-slate-200">
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">Patient</p>
            <p className="font-semibold text-lg text-slate-900">{receipt.patientSnapshot.name}</p>
            {receipt.patientSnapshot.phone && (
              <p className="text-slate-600">{receipt.patientSnapshot.phone}</p>
            )}
          </div>

          {/* Line Items */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs sm:text-sm font-medium text-slate-500 uppercase">
                    Description
                  </th>
                  <th className="text-right py-2 text-xs sm:text-sm font-medium text-slate-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 text-slate-900">{item.description}</td>
                    <td className="py-3 text-right font-medium text-slate-900">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{receipt.subtotal}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Discount
                  {receipt.discountReason && ` (${receipt.discountReason})`}
                </span>
                <span>-₹{receipt.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
              <span>Total</span>
              <span>₹{receipt.totalAmount}</span>
            </div>
          </div>

          {/* Payment Mode */}
          {receipt.paymentMode && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Payment Mode:{" "}
                <span className="text-slate-900 font-medium capitalize">
                  {receipt.paymentMode}
                </span>
              </p>
            </div>
          )}

          {/* Footer */}
          {clinic?.footerText && (
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-slate-500 italic text-sm">{clinic.footerText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <ShareReceiptButton
          receiptId={id}
          isCurrentlyShared={isCurrentlyShared}
        />
        <PrintButton />
      </div>
    </div>
  );
}
