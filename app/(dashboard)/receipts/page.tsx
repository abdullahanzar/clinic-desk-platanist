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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Receipts</h1>
        <p className="text-sm text-slate-500 mt-1">{recentReceipts.length} receipts</p>
      </div>

      {recentReceipts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-slate-400 dark:text-slate-500" />
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
                  className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {receipt.receiptNumber}
                        </span>
                        {isShared && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate mt-1">
                        {receipt.patientSnapshot.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        ₹{receipt.totalAmount}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          receipt.isPaid
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {receipt.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateIndian(receipt.receiptDate)}
                    {receipt.patientSnapshot.phone && ` • ${receipt.patientSnapshot.phone}`}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentReceipts.map((receipt) => {
                    const isShared =
                      currentSharedReceiptId === receipt._id.toString();
                    return (
                      <tr key={receipt._id.toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                              {receipt.receiptNumber}
                            </span>
                            {isShared && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                                Shared
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {receipt.patientSnapshot.name}
                          </p>
                          {receipt.patientSnapshot.phone && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {receipt.patientSnapshot.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {formatDateIndian(receipt.receiptDate)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹{receipt.totalAmount}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                              receipt.isPaid
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
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
                            className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm"
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
