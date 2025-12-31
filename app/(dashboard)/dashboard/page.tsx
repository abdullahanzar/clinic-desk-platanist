import { getSession } from "@/lib/auth/session";
import { getVisitsCollection, getReceiptsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, Receipt, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const visits = await getVisitsCollection();
  const receipts = await getReceiptsCollection();
  const clinicId = new ObjectId(session.clinicId);
  const today = new Date();

  // Get today's stats
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [todayVisits, waitingCount, completedCount, todayReceipts] = await Promise.all([
    visits.countDocuments({
      clinicId,
      visitDate: { $gte: todayStart, $lte: todayEnd },
    }),
    visits.countDocuments({
      clinicId,
      visitDate: { $gte: todayStart, $lte: todayEnd },
      status: "waiting",
    }),
    visits.countDocuments({
      clinicId,
      visitDate: { $gte: todayStart, $lte: todayEnd },
      status: "completed",
    }),
    receipts.countDocuments({
      clinicId,
      receiptDate: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Today's Visits"
          value={todayVisits}
          icon={Calendar}
          variant="brand"
        />
        <StatCard
          title="Waiting"
          value={waitingCount}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Receipts Today"
          value={todayReceipts}
          icon={Receipt}
          variant="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {session.role === "frontdesk" && (
            <Link
              href="/visits/new"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/20 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              <span>New Patient Visit</span>
            </Link>
          )}
          <Link
            href="/visits"
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            <Users className="w-5 h-5" />
            <span>View Queue</span>
          </Link>
          <Link
            href="/receipts"
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            <Receipt className="w-5 h-5" />
            <span>View Receipts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "brand" | "warning" | "success" | "purple";
}) {
  const variantClasses = {
    brand: "bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border-brand-200",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200",
    success: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200",
    purple: "bg-gradient-to-br from-violet-50 to-violet-100 text-violet-700 border-violet-200",
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 lg:p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{value}</p>
      <p className="text-xs sm:text-sm font-medium opacity-75 mt-1">{title}</p>
    </div>
  );
}
