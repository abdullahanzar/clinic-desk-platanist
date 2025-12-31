import { getClinicsCollection, getReceiptsCollection } from "@/lib/db/collections";
import { formatDateIndian } from "@/lib/utils/date";
import { PublicPrintButton } from "@/components/receipts/public-print-button";
import { RefreshButton } from "@/components/receipts/refresh-button";
import { Building2, Receipt, Download, Check, Clock, Pill } from "lucide-react";

// For V1, we'll use a hardcoded clinic slug since we're single-tenant
const CLINIC_SLUG = "demo-clinic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CurrentSharedReceiptPage() {
  const clinics = await getClinicsCollection();
  const receipts = await getReceiptsCollection();

  // Get clinic
  const clinic = await clinics.findOne({ slug: CLINIC_SLUG });

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Clinic Not Found
          </h1>
          <p className="text-slate-500">
            Please contact the clinic for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Check if there's an active shared receipt
  if (!clinic.currentSharedReceiptId) {
    return <NoReceiptView clinicName={clinic.name} />;
  }

  // Check expiration
  if (
    clinic.currentSharedReceiptExpiresAt &&
    clinic.currentSharedReceiptExpiresAt < new Date()
  ) {
    // Clear expired receipt
    await clinics.updateOne(
      { _id: clinic._id },
      {
        $set: {
          currentSharedReceiptId: null,
          currentSharedReceiptExpiresAt: null,
        },
      }
    );
    return <NoReceiptView clinicName={clinic.name} />;
  }

  // Get receipt
  const receipt = await receipts.findOne({ _id: clinic.currentSharedReceiptId });

  if (!receipt) {
    return <NoReceiptView clinicName={clinic.name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-5 sm:p-6 text-center">
            <h1 className="text-lg sm:text-xl font-bold">{clinic.name}</h1>
            {clinic.headerText && (
              <p className="text-brand-100 text-xs mt-0.5">{clinic.headerText}</p>
            )}
            {clinic.publicProfile?.doctorName && (
              <p className="text-brand-50 text-sm mt-1 font-medium">
                {clinic.publicProfile.doctorName}
                {clinic.publicProfile.qualifications && (
                  <span className="font-normal text-brand-100"> ({clinic.publicProfile.qualifications})</span>
                )}
              </p>
            )}
            {clinic.address && (
              <p className="text-brand-100 text-sm mt-1">
                {clinic.address.line1}
                {clinic.address.line2 && `, ${clinic.address.line2}`}
                , {clinic.address.city} - {clinic.address.pincode}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 text-brand-100 text-sm mt-1">
              {clinic.phone && <span>Ph: {clinic.phone}</span>}
              {clinic.email && <span>• {clinic.email}</span>}
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-5 sm:p-6">
            {/* Receipt Number & Date */}
            <div className="flex justify-between text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
              <span className="font-mono">{receipt.receiptNumber}</span>
              <span>{formatDateIndian(receipt.receiptDate)}</span>
            </div>

            {/* Patient */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Patient</p>
              <p className="font-semibold text-lg text-slate-900">
                {receipt.patientSnapshot.name}
              </p>
            </div>

            {/* Prescription Info - if included */}
            {receipt.prescriptionSnapshot && (receipt.prescriptionSnapshot.diagnosis || receipt.prescriptionSnapshot.advice) && (
              <div className="mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-4 h-4 text-brand-600" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Prescription</p>
                </div>
                {receipt.prescriptionSnapshot.diagnosis && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-500">Diagnosis</p>
                    <p className="text-slate-800">{receipt.prescriptionSnapshot.diagnosis}</p>
                  </div>
                )}
                {receipt.prescriptionSnapshot.advice && (
                  <div>
                    <p className="text-xs text-slate-500">Advice</p>
                    <p className="text-slate-800">{receipt.prescriptionSnapshot.advice}</p>
                  </div>
                )}
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-3 mb-6">
              {receipt.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-slate-700">{item.description}</span>
                  <span className="font-medium text-slate-900">₹{item.amount}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              {receipt.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{receipt.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{receipt.discountAmount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>₹{receipt.totalAmount}</span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-6 text-center">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${
                  receipt.isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {receipt.isPaid ? (
                  <><Check className="w-4 h-4" /> Payment Received</>
                ) : (
                  <><Clock className="w-4 h-4" /> Payment Pending</>
                )}
              </span>
            </div>

            {/* Tax Information */}
            {clinic.taxInfo?.showTaxOnReceipt && (clinic.taxInfo?.gstin || clinic.taxInfo?.registrationNumber || clinic.taxInfo?.pan) && (
              <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-0.5 text-center">
                {clinic.taxInfo.gstin && <p>GSTIN: {clinic.taxInfo.gstin}</p>}
                {clinic.taxInfo.pan && <p>PAN: {clinic.taxInfo.pan}</p>}
                {clinic.taxInfo.registrationNumber && <p>Reg. No: {clinic.taxInfo.registrationNumber}</p>}
              </div>
            )}

            {/* Footer */}
            {clinic.footerText && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm italic">{clinic.footerText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={`/api/public/receipt/${receipt._id.toString()}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-center font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 shadow-lg shadow-brand-500/20 transition-all"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </a>
          <PublicPrintButton 
            receiptId={receipt._id.toString()} 
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50" 
          />
        </div>

        {/* Expiry Notice */}
        <p className="mt-6 text-center text-sm text-slate-400">
          This receipt will expire shortly. Please download or print if needed.
        </p>
      </div>
    </div>
  );
}

function NoReceiptView({ clinicName }: { clinicName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Receipt className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{clinicName}</h1>
        <p className="text-slate-500 mb-6">
          No receipt is currently being shared.
          <br />
          Please contact the front desk for assistance.
        </p>
        <RefreshButton />
      </div>
    </div>
  );
}
