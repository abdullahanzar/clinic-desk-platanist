"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Medication } from "@/types";
import { Stethoscope, Pill, ClipboardList, Plus, AlertTriangle, Loader2, Check, Settings } from "lucide-react";
import MedicationAutosuggest from "./medication-autosuggest";
import AdviceAutosuggest from "./advice-autosuggest";
import DiagnosisAutosuggest from "./diagnosis-autosuggest";
import Link from "next/link";

interface PrescriptionFormProps {
  visitId: string;
  existingPrescription?: {
    _id: string;
    diagnosis?: string;
    chiefComplaints?: string;
    medications: Medication[];
    advice?: string;
    followUpDate?: string;
    status: string;
  };
}

export default function PrescriptionForm({
  visitId,
  existingPrescription,
}: PrescriptionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    diagnosis: existingPrescription?.diagnosis || "",
    chiefComplaints: existingPrescription?.chiefComplaints || "",
    advice: existingPrescription?.advice || "",
    followUpDate: existingPrescription?.followUpDate?.split("T")[0] || "",
  });

  const [medications, setMedications] = useState<Medication[]>(
    existingPrescription?.medications || [
      { name: "", dosage: "", duration: "", instructions: "" },
    ]
  );

  const isFinalized = existingPrescription?.status === "finalized";

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (finalize = false) => {
    setError("");
    setLoading(true);

    // Filter out empty medications
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
          ...formData,
          medications: validMedications,
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

  if (isFinalized) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p>This prescription has been finalized and cannot be edited.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 dark:border-red-900 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Chief Complaints & Diagnosis */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          Assessment
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Chief Complaints
            </label>
            <textarea
              value={formData.chiefComplaints}
              onChange={(e) =>
                setFormData({ ...formData, chiefComplaints: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Patient's main complaints..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Diagnosis
            </label>
            <DiagnosisAutosuggest
              value={formData.diagnosis}
              onChange={(value) =>
                setFormData({ ...formData, diagnosis: value })
              }
              placeholder="e.g., Acute Upper Respiratory Infection"
            />
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-brand-600" />
            Medications
          </h3>
          <div className="flex items-center gap-2">
            <Link
              href={`/visits/${visitId}/prescription/templates`}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm"
            >
              <Settings className="w-4 h-4" /> Manage Templates
            </Link>
            <button
              type="button"
              onClick={addMedication}
              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Medication
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {medications.map((med, index) => (
            <MedicationAutosuggest
              key={index}
              index={index}
              value={med}
              onChange={(updatedMed) => {
                const updated = [...medications];
                updated[index] = updatedMed;
                setMedications(updated);
              }}
              onRemove={() => removeMedication(index)}
              canRemove={medications.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Advice & Follow-up */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-600" />
          Advice & Follow-up
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Advice
            </label>
            <AdviceAutosuggest
              value={formData.advice}
              onChange={(value) =>
                setFormData({ ...formData, advice: value })
              }
              placeholder="Rest, drink plenty of fluids..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) =>
                setFormData({ ...formData, followUpDate: e.target.value })
              }
              className="w-full sm:w-auto px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
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
          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
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
