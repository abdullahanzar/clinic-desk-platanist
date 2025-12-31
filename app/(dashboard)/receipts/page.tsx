import { getSession } from "@/lib/auth/session";
import { getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { formatDateIndian } from "@/lib/utils/date";
import Link from "next/link";
import { Receipt, ChevronRight, Check, Clock } from "lucide-react";

export default async function ReceiptsPage() {
  const session = await getSession();
  if (!session) return null;

  const receipts = await getReceiptsCollection();
  const clinics = await getClinicsCollection();
  const clinicId = new ObjectId(session.clinicId);

  const [recentReceipts, clinic] = await Promise.all([
    receipts
      .find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    clinics.findOne({ _id: clinicId }),
  ]);

  const currentSharedReceiptId = clinic?.currentSharedReceiptId?.toString();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Receipts</h1>
        <p className="text-sm text-slate-500 mt-1">{recentReceipts.length} receipts</p>
      </div>

      {recentReceipts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No receipts yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Receipts will appear here once created
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {recentReceipts.map((receipt) => {
              const isShared =
                currentSharedReceiptId === receipt._id.toString();
              return (
                <Link
                  key={receipt._id.toString()}
                  href={`/receipts/${receipt._id.toString()}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-900 text-sm">
                          {receipt.receiptNumber}
                        </span>
                        {isShared && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-brand-100 text-brand-700 rounded-full">
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 truncate mt-1">
                        {receipt.patientSnapshot.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-slate-900">
                        ₹{receipt.totalAmount}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          receipt.isPaid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {receipt.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDateIndian(receipt.receiptDate)}
                    {receipt.patientSnapshot.phone && ` • ${receipt.patientSnapshot.phone}`}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReceipts.map((receipt) => {
                    const isShared =
                      currentSharedReceiptId === receipt._id.toString();
                    return (
                      <tr key={receipt._id.toString()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-slate-900">
                              {receipt.receiptNumber}
                            </span>
                            {isShared && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-brand-100 text-brand-700 rounded-full">
                                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                                Shared
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {receipt.patientSnapshot.name}
                          </p>
                          {receipt.patientSnapshot.phone && (
                            <p className="text-sm text-slate-500">
                              {receipt.patientSnapshot.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDateIndian(receipt.receiptDate)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ₹{receipt.totalAmount}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                              receipt.isPaid
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {receipt.isPaid ? (
                              <><Check className="w-3.5 h-3.5" /> Paid</>
                            ) : (
                              <><Clock className="w-3.5 h-3.5" /> Unpaid</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/receipts/${receipt._id.toString()}`}
                            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
