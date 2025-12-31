"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Pill,
  ClipboardList,
  Plus,
  X,
  AlertTriangle,
  Loader2,
  Check,
  Calendar,
  Search,
} from "lucide-react";
import { usePrescription } from "./prescription-context";
import ChiefComplaintsSelector from "./chief-complaints-selector";

interface EnhancedPrescriptionFormProps {
  visitId: string;
  existingPrescription?: {
    _id: string;
    status: string;
  };
}

export default function EnhancedPrescriptionForm({
  visitId,
  existingPrescription,
}: EnhancedPrescriptionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    selectedComplaints,
    diagnosis,
    setDiagnosis,
    medications,
    updateMedication,
    addMedication,
    removeMedication,
    advice,
    setAdvice,
    followUpDate,
    setFollowUpDate,
    setActiveField,
    setActiveMedicationIndex,
    setIsSidebarOpen,
  } = usePrescription();

  const isFinalized = existingPrescription?.status === "finalized";

  const handleSave = async (finalize = false) => {
    setError("");
    setLoading(true);

    // Prepare data
    const chiefComplaints = selectedComplaints.join(", ");
    const validMedications = medications.filter((m) => m.name.trim());

    try {
      const url = existingPrescription
        ? `/api/prescriptions/${existingPrescription._id}`
        : "/api/prescriptions";
      const method = existingPrescription ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          chiefComplaints,
          diagnosis,
          medications: validMedications,
          advice,
          followUpDate: followUpDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save prescription");
        return;
      }

      // Finalize if requested
      if (finalize) {
        const prescriptionId = existingPrescription?._id || data.prescription._id;
        const finalizeRes = await fetch(
          `/api/prescriptions/${prescriptionId}/finalize`,
          { method: "POST" }
        );

        if (!finalizeRes.ok) {
          const finalizeData = await finalizeRes.json();
          setError(finalizeData.error || "Failed to finalize prescription");
          return;
        }
      }

      router.push(`/visits/${visitId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldFocus = (field: "complaints" | "diagnosis" | "medication" | "advice") => {
    setActiveField(field);
    if (field !== "medication") {
      setActiveMedicationIndex(null);
    }
    // Open sidebar on mobile
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(true);
    }
  };

  const handleMedicationFocus = (index: number) => {
    setActiveField("medication");
    setActiveMedicationIndex(index);
    // Open sidebar on mobile
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(true);
    }
  };

  if (isFinalized) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>This prescription has been finalized and cannot be edited.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Chief Complaints & Diagnosis */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          Assessment
        </h3>

        <div className="space-y-5">
          {/* Chief Complaints */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Chief Complaints
            </label>
            <ChiefComplaintsSelector />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Diagnosis
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                onFocus={() => handleFieldFocus("diagnosis")}
                placeholder="Type or select diagnosis..."
                className="w-full pl-9 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 lg:hidden">
              Tap to see diagnosis suggestions →
            </p>
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-brand-600" />
            Medications
          </h3>
          <button
            type="button"
            onClick={addMedication}
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Medication
          </button>
        </div>

        <div className="space-y-3">
          {medications.map((med, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Medication Name */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, { ...med, name: e.target.value })
                    }
                    onFocus={() => handleMedicationFocus(index)}
                    placeholder="Medication name (tap to see suggestions)"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Dosage & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, { ...med, dosage: e.target.value })
                    }
                    onFocus={() => handleMedicationFocus(index)}
                    placeholder="Dosage (1-0-1)"
                    className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) =>
                      updateMedication(index, { ...med, duration: e.target.value })
                    }
                    onFocus={() => handleMedicationFocus(index)}
                    placeholder="Duration (5 days)"
                    className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Instructions */}
                <input
                  type="text"
                  value={med.instructions || ""}
                  onChange={(e) =>
                    updateMedication(index, { ...med, instructions: e.target.value })
                  }
                  onFocus={() => handleMedicationFocus(index)}
                  placeholder="Instructions (After food)"
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-3 lg:hidden">
          Tap medication fields to see quick suggestions →
        </p>
      </div>

      {/* Advice & Follow-up */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-600" />
          Advice & Follow-up
        </h3>

        <div className="space-y-4">
          {/* Advice */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Advice
            </label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              onFocus={() => handleFieldFocus("advice")}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400 resize-none"
              placeholder="Tap to see advice templates or type custom advice..."
            />
            <p className="text-xs text-slate-500 mt-1.5 lg:hidden">
              Tap to see advice suggestions →
            </p>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Actions - Fixed at bottom on mobile */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pb-20 lg:pb-0">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium text-center"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save & Finalize
            </>
          )}
        </button>
      </div>
    </div>
  );
}
