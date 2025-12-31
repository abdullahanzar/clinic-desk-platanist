import { getSession } from "@/lib/auth/session";
import { getVisitsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay, formatTime } from "@/lib/utils/date";
import Link from "next/link";
import { Users, UserPlus, ChevronRight } from "lucide-react";

export default async function VisitsPage() {
  const session = await getSession();
  if (!session) return null;

  const visits = await getVisitsCollection();
  const clinicId = new ObjectId(session.clinicId);
  const today = new Date();

  const todayVisits = await visits
    .find({
      clinicId,
      visitDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
    })
    .sort({ tokenNumber: 1, createdAt: 1 })
    .toArray();

  const statusConfig = {
    waiting: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
    "in-consultation": { bg: "bg-brand-100", text: "text-brand-800", dot: "bg-brand-500" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
    cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Today's Queue</h1>
          <p className="text-sm text-slate-500 mt-1">{todayVisits.length} patients</p>
        </div>
        {session.role === "frontdesk" && (
          <Link
            href="/visits/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/20 font-medium"
          >
            <UserPlus className="w-5 h-5" />
            <span>New Visit</span>
          </Link>
        )}
      </div>

      {todayVisits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No visits today yet</p>
          {session.role === "frontdesk" && (
            <Link
              href="/visits/new"
              className="inline-flex items-center gap-2 mt-4 text-brand-600 hover:text-brand-700 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Create the first visit
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {todayVisits.map((visit) => (
              <Link
                key={visit._id.toString()}
                href={`/visits/${visit._id.toString()}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold rounded-xl flex items-center justify-center text-lg">
                    {visit.tokenNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {visit.patient.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {visit.patient.phone}
                          {visit.patient.age && ` • ${visit.patient.age}y`}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          statusConfig[visit.status].bg
                        } ${statusConfig[visit.status].text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[visit.status].dot}`} />
                        {visit.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-1">
                      {visit.visitReason}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTime(visit.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Time
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
                  {todayVisits.map((visit) => (
                    <tr key={visit._id.toString()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold rounded-xl">
                          {visit.tokenNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {visit.patient.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {visit.patient.phone}
                            {visit.patient.age && ` • ${visit.patient.age}y`}
                            {visit.patient.gender && ` • ${visit.patient.gender}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {visit.visitReason}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatTime(visit.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                            statusConfig[visit.status].bg
                          } ${statusConfig[visit.status].text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[visit.status].dot}`} />
                          {visit.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/visits/${visit._id.toString()}`}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
