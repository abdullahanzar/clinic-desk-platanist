"use client";

import { useState } from "react";
import { Pill, ClipboardList, Stethoscope, Upload } from "lucide-react";
import MedicationsTab from "./templates/medications-tab";
import AdviceTab from "./templates/advice-tab";
import DiagnosesTab from "./templates/diagnoses-tab";
import BulkUploadTab from "./templates/bulk-upload-tab";

type TabType = "medications" | "advice" | "diagnoses" | "upload";

export default function TemplatesManager() {
  const [activeTab, setActiveTab] = useState<TabType>("medications");

  const tabs = [
    {
      id: "medications" as TabType,
      label: "Medications",
      icon: Pill,
    },
    {
      id: "advice" as TabType,
      label: "Advice",
      icon: ClipboardList,
    },
    {
      id: "diagnoses" as TabType,
      label: "Diagnoses",
      icon: Stethoscope,
    },
    {
      id: "upload" as TabType,
      label: "Bulk Upload",
      icon: Upload,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {activeTab === "medications" && <MedicationsTab />}
        {activeTab === "advice" && <AdviceTab />}
        {activeTab === "diagnoses" && <DiagnosesTab />}
        {activeTab === "upload" && <BulkUploadTab />}
      </div>
    </div>
  );
}
