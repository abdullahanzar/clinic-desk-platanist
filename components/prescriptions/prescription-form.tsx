"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Medication } from "@/types";
import { Stethoscope, Pill, ClipboardList, Plus, Trash2, AlertTriangle, Loader2, Check } from "lucide-react";

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

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Chief Complaints & Diagnosis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-600" />
          Assessment
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Chief Complaints
            </label>
            <textarea
              value={formData.chiefComplaints}
              onChange={(e) =>
                setFormData({ ...formData, chiefComplaints: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Patient's main complaints..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Diagnosis
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
              placeholder="e.g., Acute Upper Respiratory Infection"
            />
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
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

        <div className="space-y-4">
          {medications.map((med, index) => (
            <div
              key={index}
              className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, "name", e.target.value)
                    }
                    placeholder="Medication name (e.g., Tab. Paracetamol 500mg)"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) =>
                    updateMedication(index, "dosage", e.target.value)
                  }
                  placeholder="Dosage (e.g., 1-0-1)"
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) =>
                    updateMedication(index, "duration", e.target.value)
                  }
                  placeholder="Duration (e.g., 5 days)"
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <input
                  type="text"
                  value={med.instructions || ""}
                  onChange={(e) =>
                    updateMedication(index, "instructions", e.target.value)
                  }
                  placeholder="Instructions (e.g., After food)"
                  className="sm:col-span-2 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice & Follow-up */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-600" />
          Advice & Follow-up
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Advice
            </label>
            <textarea
              value={formData.advice}
              onChange={(e) =>
                setFormData({ ...formData, advice: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Rest, drink plenty of fluids..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) =>
                setFormData({ ...formData, followUpDate: e.target.value })
              }
              className="w-full sm:w-auto px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
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
