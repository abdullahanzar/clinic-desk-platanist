"use client";

import { PrescriptionProvider } from "@/components/prescriptions/prescription-context";
import EnhancedPrescriptionForm from "@/components/prescriptions/enhanced-prescription-form";
import SuggestionSidebar from "@/components/prescriptions/suggestion-sidebar";
import type { Medication } from "@/types";

interface PrescriptionPageClientProps {
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

export default function PrescriptionPageClient({
  visitId,
  existingPrescription,
}: PrescriptionPageClientProps) {
  return (
    <PrescriptionProvider
      initialData={{
        chiefComplaints: existingPrescription?.chiefComplaints,
        diagnosis: existingPrescription?.diagnosis,
        medications: existingPrescription?.medications,
        advice: existingPrescription?.advice,
        followUpDate: existingPrescription?.followUpDate,
      }}
    >
      <div className="flex gap-6">
        {/* Main form */}
        <div className="flex-1 min-w-0">
          <EnhancedPrescriptionForm
            visitId={visitId}
            existingPrescription={
              existingPrescription
                ? {
                    _id: existingPrescription._id,
                    status: existingPrescription.status,
                  }
                : undefined
            }
          />
        </div>

        {/* Suggestion Sidebar */}
        <SuggestionSidebar />
      </div>
    </PrescriptionProvider>
  );
}
