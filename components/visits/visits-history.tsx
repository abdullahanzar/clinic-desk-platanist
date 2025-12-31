"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CalendarDays,
  Loader2,
  X,
  User,
  ClipboardList,
  Plus,
} from "lucide-react";

type ViewMode = "day" | "month";

interface Visit {
  _id: string;
  patient: {
    name: string;
    phone: string;
    age?: number;
    gender?: string;
  };
  visitReason: string;
  visitDate: string;
  tokenNumber: number;
  status: "waiting" | "in-consultation" | "completed" | "cancelled";
  createdAt: string;
}

interface VisitsHistoryProps {
  role: string;
  initialVisits: Visit[];
}

const statusConfig = {
  waiting: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-800 dark:text-amber-300", dot: "bg-amber-500" },
  "in-consultation": { bg: "bg-teal-100 dark:bg-teal-950", text: "text-teal-800 dark:text-teal-300", dot: "bg-teal-500" },
  completed: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-800 dark:text-emerald-300", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
};

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function VisitsHistory({ role, initialVisits }: VisitsHistoryProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [loading, setLoading] = useState(false);
  
  // New visit form state
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    age: "",
    gender: "",
    visitReason: "",
  });

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const isCurrentMonth =
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  // Fetch visits when date or view mode changes
  useEffect(() => {
    // Skip initial fetch on today (we have initialVisits)
    if (isToday && viewMode === "day" && visits === initialVisits) {
      return;
    }

    const fetchVisits = async () => {
      setLoading(true);
      try {
        let url = "/api/visits?";
        if (viewMode === "month") {
          url += `month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`;
        } else {
          url += `date=${formatDateISO(selectedDate)}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.visits) {
          setVisits(data.visits);
        }
      } catch (error) {
        console.error("Failed to fetch visits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [selectedDate, viewMode]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleNewVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create visit");
        return;
      }

      // Add the new visit to the list if we're viewing today
      if (isToday && viewMode === "day") {
        setVisits((prev) => [...prev, {
          _id: data.visit._id,
          patient: data.visit.patient,
          visitReason: data.visit.visitReason,
          visitDate: data.visit.visitDate,
          tokenNumber: data.visit.tokenNumber,
          status: data.visit.status,
          createdAt: data.visit.createdAt,
        }].sort((a, b) => a.tokenNumber - b.tokenNumber));
      }

      // Reset form and close
      setFormData({
        patientName: "",
        phone: "",
        age: "",
        gender: "",
        visitReason: "",
      });
      setShowNewVisitForm(false);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const resetAndCloseForm = () => {
    setShowNewVisitForm(false);
    setFormError("");
    setFormData({
      patientName: "",
      phone: "",
      age: "",
      gender: "",
      visitReason: "",
    });
  };

  // Group visits by date for month view
  const groupedVisits: Record<string, Visit[]> = {};
  if (viewMode === "month") {
    visits.forEach((visit) => {
      const dateKey = formatDateISO(new Date(visit.visitDate));
      if (!groupedVisits[dateKey]) {
        groupedVisits[dateKey] = [];
      }
      groupedVisits[dateKey].push(visit);
    });
  }

  // Get stats
  const stats = {
    total: visits.length,
    waiting: visits.filter((v) => v.status === "waiting").length,
    inConsultation: visits.filter((v) => v.status === "in-consultation").length,
    completed: visits.filter((v) => v.status === "completed").length,
    cancelled: visits.filter((v) => v.status === "cancelled").length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isToday && viewMode === "day"
                ? "Today's Queue"
                : viewMode === "day"
                ? "Visit History"
                : "Monthly Overview"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total} patient{stats.total !== 1 ? "s" : ""}
              {viewMode === "day" && !isToday && ` on ${formatDate(selectedDate)}`}
              {viewMode === "month" && ` in ${formatMonthYear(selectedDate)}`}
            </p>
          </div>
          {isToday && viewMode === "day" && (
            <button
              onClick={() => setShowNewVisitForm(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/20 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              <span>New Visit</span>
            </button>
          )}
        </div>

        {/* View Mode & Date Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("day")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "day"
                  ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Day View
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "month"
                  ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Month View
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={viewMode === "day" ? "Previous day" : "Previous month"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {viewMode === "day" ? (
                <input
                  type="date"
                  value={formatDateISO(selectedDate)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  max={formatDateISO(today)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              ) : (
                <input
                  type="month"
                  value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split("-");
                    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                  }}
                  max={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              )}

              {!(isToday && viewMode === "day") && !(isCurrentMonth && viewMode === "month") && (
                <button
                  onClick={goToToday}
                  className="px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={() => navigateDate("next")}
              disabled={
                (viewMode === "day" && isSameDay(selectedDate, today)) ||
                (viewMode === "month" && isCurrentMonth)
              }
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={viewMode === "day" ? "Next day" : "Next month"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {visits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.waiting}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Waiting</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-950 rounded-xl p-3 border border-teal-100 dark:border-teal-800">
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{stats.inConsultation}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400">In Consultation</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.cancelled}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cancelled</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && visits.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 font-medium">
            {viewMode === "day"
              ? isToday
                ? "No visits today yet"
                : `No visits on ${formatDate(selectedDate)}`
              : `No visits in ${formatMonthYear(selectedDate)}`}
          </p>
          {isToday && viewMode === "day" && (
            <button
              onClick={() => setShowNewVisitForm(true)}
              className="inline-flex items-center gap-2 mt-4 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Create the first visit
            </button>
          )}
        </div>
      )}

      {/* Day View */}
      {!loading && visits.length > 0 && viewMode === "day" && (
        <>
          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {visits.map((visit) => (
              <Link
                key={visit._id}
                href={`/visits/${visit._id}`}
                className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all"
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Time
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
                  {visits.map((visit) => (
                    <tr key={visit._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold rounded-xl">
                          {visit.tokenNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {visit.patient.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {visit.patient.phone}
                            {visit.patient.age && ` • ${visit.patient.age}y`}
                            {visit.patient.gender && ` • ${visit.patient.gender}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {visit.visitReason}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
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
                          href={`/visits/${visit._id}`}
                          className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm"
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

      {/* Month View */}
      {!loading && visits.length > 0 && viewMode === "month" && (
        <div className="space-y-4">
          {Object.entries(groupedVisits)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, dayVisits]) => {
              const date = new Date(dateKey);
              const dayStats = {
                total: dayVisits.length,
                completed: dayVisits.filter((v) => v.status === "completed").length,
              };

              return (
                <div
                  key={dateKey}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                        <span className="text-brand-700 font-bold">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {date.toLocaleDateString("en-IN", { weekday: "long" })}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateShort(date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {dayStats.total} visit{dayStats.total !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                        {dayStats.completed} completed
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setViewMode("day");
                        }}
                        className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
                      >
                        View Day
                      </button>
                    </div>
                  </div>

                  {/* Visits List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dayVisits
                      .sort((a, b) => a.tokenNumber - b.tokenNumber)
                      .slice(0, 5)
                      .map((visit) => (
                        <Link
                          key={visit._id}
                          href={`/visits/${visit._id}`}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="w-8 h-8 bg-brand-50 text-brand-600 font-medium rounded-lg flex items-center justify-center text-sm">
                            {visit.tokenNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {visit.patient.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {visit.visitReason}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                              statusConfig[visit.status].bg
                            } ${statusConfig[visit.status].text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[visit.status].dot}`} />
                            {visit.status.replace("-", " ")}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </Link>
                      ))}
                    {dayVisits.length > 5 && (
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setViewMode("day");
                        }}
                        className="w-full px-4 py-3 text-sm text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors text-center font-medium"
                      >
                        View all {dayVisits.length} visits →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* New Visit Modal */}
      {showNewVisitForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={resetAndCloseForm}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Patient Visit</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Register a new patient for today&apos;s queue</p>
                </div>
                <button
                  onClick={resetAndCloseForm}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleNewVisitSubmit} className="p-5 space-y-5">
                {formError && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                    {formError}
                  </div>
                )}

                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-600" />
                    Patient Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400"
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400"
                        placeholder="25"
                        min="0"
                        max="150"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-600" />
                    Visit Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.visitReason}
                      onChange={(e) => setFormData({ ...formData, visitReason: e.target.value })}
                      required
                      rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 resize-none"
                      placeholder="Fever, cough, cold..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetAndCloseForm}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Visit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
