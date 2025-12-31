import { getSession } from "@/lib/auth/session";
import { getVisitsCollection, getReceiptsCollection, getClinicsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { startOfDay, endOfDay } from "@/lib/utils/date";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, Receipt, UserPlus, Users, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const visits = await getVisitsCollection();
  const receipts = await getReceiptsCollection();
  const clinics = await getClinicsCollection();
  const clinicId = new ObjectId(session.clinicId);
  const today = new Date();

  // Get clinic info for personalized greeting
  const clinic = await clinics.findOne({ _id: clinicId });

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

  // Personalized greeting based on time of day
  const hour = today.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  const displayName = session.role === "doctor" 
    ? (clinic?.publicProfile?.doctorName || "Doctor")
    : "Team";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {greeting}, <span className="font-medium text-slate-700 dark:text-slate-300">{displayName}</span>
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          {clinic?.name || "Dashboard"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h2>
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
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <Users className="w-5 h-5" />
            <span>View Queue</span>
          </Link>
          <Link
            href="/receipts"
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <Receipt className="w-5 h-5" />
            <span>View Receipts</span>
          </Link>
          {session.role === "doctor" && (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              <Settings className="w-5 h-5" />
              <span>Clinic Settings</span>
            </Link>
          )}
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
    brand: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    success: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    purple: "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
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
