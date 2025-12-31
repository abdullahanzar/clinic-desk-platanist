"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import type { Medication } from "@/types";
import { COMMON_COMPLAINTS, ComplaintCategory } from "@/lib/data/common-complaints";

// Template types
export interface DiagnosisTemplate {
  _id: string;
  name: string;
  icdCode?: string;
  category?: string;
  description?: string;
  isDefault: boolean;
  usageCount: number;
}

export interface MedicationTemplate {
  _id: string;
  name: string;
  dosage: string;
  duration: string;
  instructions?: string;
  category?: string;
  description?: string;
  source: "allopathic" | "homeopathic" | "custom";
  isDefault: boolean;
  usageCount: number;
}

export interface AdviceTemplate {
  _id: string;
  title: string;
  content: string;
  category?: string;
  isDefault: boolean;
  usageCount: number;
}

// Active field types
export type ActiveField =
  | "complaints"
  | "diagnosis"
  | "medication"
  | "advice"
  | null;

// Context state
interface PrescriptionContextState {
  // Active field tracking
  activeField: ActiveField;
  setActiveField: (field: ActiveField) => void;
  activeMedicationIndex: number | null;
  setActiveMedicationIndex: (index: number | null) => void;

  // Templates cache
  diagnosisTemplates: DiagnosisTemplate[];
  medicationTemplates: MedicationTemplate[];
  adviceTemplates: AdviceTemplate[];
  complaintsData: ComplaintCategory[];
  isLoading: boolean;
  
  // Categories
  diagnosisCategories: string[];
  medicationCategories: string[];
  adviceCategories: string[];

  // Selected values
  selectedComplaints: string[];
  setSelectedComplaints: (complaints: string[]) => void;
  addComplaint: (complaint: string) => void;
  removeComplaint: (complaint: string) => void;

  // Diagnosis
  diagnosis: string;
  setDiagnosis: (diagnosis: string) => void;

  // Medications
  medications: Medication[];
  setMedications: (medications: Medication[]) => void;
  updateMedication: (index: number, medication: Medication) => void;
  addMedication: () => void;
  removeMedication: (index: number) => void;

  // Advice
  advice: string;
  setAdvice: (advice: string) => void;
  appendAdvice: (content: string) => void;

  // Follow-up
  followUpDate: string;
  setFollowUpDate: (date: string) => void;

  // Sidebar visibility (mobile)
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Usage tracking
  incrementUsage: (type: "diagnosis" | "medication" | "advice", id: string) => void;
}

const PrescriptionContext = createContext<PrescriptionContextState | undefined>(
  undefined
);

interface PrescriptionProviderProps {
  children: ReactNode;
  initialData?: {
    chiefComplaints?: string;
    diagnosis?: string;
    medications?: Medication[];
    advice?: string;
    followUpDate?: string;
  };
}

export function PrescriptionProvider({
  children,
  initialData,
}: PrescriptionProviderProps) {
  // Active field tracking
  const [activeField, setActiveField] = useState<ActiveField>("complaints");
  const [activeMedicationIndex, setActiveMedicationIndex] = useState<number | null>(null);

  // Templates cache
  const [diagnosisTemplates, setDiagnosisTemplates] = useState<DiagnosisTemplate[]>([]);
  const [medicationTemplates, setMedicationTemplates] = useState<MedicationTemplate[]>([]);
  const [adviceTemplates, setAdviceTemplates] = useState<AdviceTemplate[]>([]);
  const [diagnosisCategories, setDiagnosisCategories] = useState<string[]>([]);
  const [medicationCategories, setMedicationCategories] = useState<string[]>([]);
  const [adviceCategories, setAdviceCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>(
    initialData?.chiefComplaints?.split(", ").filter(Boolean) || []
  );
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || "");
  const [medications, setMedications] = useState<Medication[]>(
    initialData?.medications?.length
      ? initialData.medications
      : [{ name: "", dosage: "", duration: "", instructions: "" }]
  );
  const [advice, setAdvice] = useState(initialData?.advice || "");
  const [followUpDate, setFollowUpDate] = useState(
    initialData?.followUpDate?.split("T")[0] || ""
  );

  // Sidebar state (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates/all");
        if (res.ok) {
          const data = await res.json();
          setDiagnosisTemplates(data.diagnoses.templates);
          setDiagnosisCategories(data.diagnoses.categories);
          setMedicationTemplates(data.medications.templates);
          setMedicationCategories(data.medications.categories);
          setAdviceTemplates(data.advice.templates);
          setAdviceCategories(data.advice.categories);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Complaint handlers
  const addComplaint = useCallback((complaint: string) => {
    setSelectedComplaints((prev) => {
      if (prev.includes(complaint)) return prev;
      return [...prev, complaint];
    });
  }, []);

  const removeComplaint = useCallback((complaint: string) => {
    setSelectedComplaints((prev) => prev.filter((c) => c !== complaint));
  }, []);

  // Medication handlers
  const updateMedication = useCallback((index: number, medication: Medication) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = medication;
      return updated;
    });
  }, []);

  const addMedication = useCallback(() => {
    setMedications((prev) => [
      ...prev,
      { name: "", dosage: "", duration: "", instructions: "" },
    ]);
  }, []);

  const removeMedication = useCallback((index: number) => {
    setMedications((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Advice handlers
  const appendAdvice = useCallback((content: string) => {
    setAdvice((prev) => {
      if (!prev.trim()) return content;
      return `${prev.trim()}\n\n${content}`;
    });
  }, []);

  // Sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Usage tracking (fire and forget)
  const incrementUsage = useCallback(
    (type: "diagnosis" | "medication" | "advice", id: string) => {
      fetch(`/api/templates/${type === "diagnosis" ? "diagnoses" : type === "medication" ? "medications" : "advice"}/${id}`, {
        method: "POST",
      }).catch(console.error);
    },
    []
  );

  const value: PrescriptionContextState = {
    activeField,
    setActiveField,
    activeMedicationIndex,
    setActiveMedicationIndex,
    diagnosisTemplates,
    medicationTemplates,
    adviceTemplates,
    complaintsData: COMMON_COMPLAINTS,
    isLoading,
    diagnosisCategories,
    medicationCategories,
    adviceCategories,
    selectedComplaints,
    setSelectedComplaints,
    addComplaint,
    removeComplaint,
    diagnosis,
    setDiagnosis,
    medications,
    setMedications,
    updateMedication,
    addMedication,
    removeMedication,
    advice,
    setAdvice,
    appendAdvice,
    followUpDate,
    setFollowUpDate,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    incrementUsage,
  };

  return (
    <PrescriptionContext.Provider value={value}>
      {children}
    </PrescriptionContext.Provider>
  );
}

export function usePrescription() {
  const context = useContext(PrescriptionContext);
  if (context === undefined) {
    throw new Error("usePrescription must be used within a PrescriptionProvider");
  }
  return context;
}
