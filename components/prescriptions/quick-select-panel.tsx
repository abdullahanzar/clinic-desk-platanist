"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Clock,
  TrendingUp,
  Check,
  Plus,
  Pill,
  Leaf,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { usePrescription } from "./prescription-context";
import type { DiagnosisTemplate, MedicationTemplate, AdviceTemplate } from "./prescription-context";

// Helper component for medication source badge
function SourceBadge({ source }: { source: string }) {
  switch (source) {
    case "allopathic":
      return (
        <span className="inline-flex items-center gap-0.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          <Pill className="w-3 h-3" />
        </span>
      );
    case "homeopathic":
      return (
        <span className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
          <Leaf className="w-3 h-3" />
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
          <User className="w-3 h-3" />
        </span>
      );
  }
}

// Complaints Panel
function ComplaintsPanel() {
  const {
    complaintsData,
    selectedComplaints,
    addComplaint,
    searchQuery,
  } = usePrescription();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return complaintsData;
    
    const query = searchQuery.toLowerCase();
    return complaintsData
      .map((cat) => ({
        ...cat,
        complaints: cat.complaints.filter((c) =>
          c.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.complaints.length > 0);
  }, [complaintsData, searchQuery]);

  const displayData = activeCategory
    ? filteredData.filter((cat) => cat.name === activeCategory)
    : filteredData;

  return (
    <div className="space-y-3">
      {/* Category tabs - horizontal scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeCategory === null
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {complaintsData.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setActiveCategory(cat.name === activeCategory ? null : cat.name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat.name
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Complaints grid */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {displayData.map((category) => (
          <div key={category.name}>
            {!activeCategory && (
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {category.name}
              </h4>
            )}
            <div className="flex flex-wrap gap-1.5">
              {category.complaints.map((complaint) => {
                const isSelected = selectedComplaints.includes(complaint);
                return (
                  <button
                    key={complaint}
                    type="button"
                    onClick={() => addComplaint(complaint)}
                    disabled={isSelected}
                    className={`px-2.5 py-1.5 text-sm rounded-lg transition-all ${
                      isSelected
                        ? "bg-brand-100 text-brand-700 cursor-default"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {complaint}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Diagnosis Panel
function DiagnosisPanel() {
  const {
    diagnosisTemplates,
    diagnosisCategories,
    diagnosis,
    setDiagnosis,
    searchQuery,
    incrementUsage,
    isLoading,
  } = usePrescription();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let templates = diagnosisTemplates;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.icdCode?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }
    
    if (activeCategory) {
      templates = templates.filter((t) => t.category === activeCategory);
    }
    
    return templates;
  }, [diagnosisTemplates, searchQuery, activeCategory]);

  // Group by recently used (top 5 by usage)
  const recentlyUsed = useMemo(() => {
    return [...diagnosisTemplates]
      .filter((t) => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }, [diagnosisTemplates]);

  const handleSelect = (template: DiagnosisTemplate) => {
    setDiagnosis(template.name);
    incrementUsage("diagnosis", template._id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recently used */}
      {recentlyUsed.length > 0 && !searchQuery && !activeCategory && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recently Used
          </h4>
          <div className="space-y-1">
            {recentlyUsed.map((template) => (
              <button
                key={template._id}
                type="button"
                onClick={() => handleSelect(template)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  diagnosis === template.name
                    ? "bg-brand-100 border border-brand-300"
                    : "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                  {template.name}
                  {diagnosis === template.name && (
                    <Check className="w-4 h-4 text-brand-600" />
                  )}
                </div>
                {template.icdCode && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    ICD-10: {template.icdCode}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeCategory === null
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {diagnosisCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* All diagnoses */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No diagnoses found. Type in the form to add a custom diagnosis.
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template._id}
              type="button"
              onClick={() => handleSelect(template)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                diagnosis === template.name
                  ? "bg-brand-100 border border-brand-300"
                  : "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <div className="font-medium text-sm text-slate-900 flex items-center justify-between gap-2">
                <span className="truncate">{template.name}</span>
                {diagnosis === template.name && (
                  <Check className="w-4 h-4 text-brand-600 shrink-0" />
                )}
              </div>
              {(template.icdCode || template.category) && (
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  {template.icdCode && <span>ICD: {template.icdCode}</span>}
                  {template.category && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                      {template.category}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// Medication Panel
function MedicationPanel() {
  const {
    medicationTemplates,
    medicationCategories,
    medications,
    activeMedicationIndex,
    updateMedication,
    searchQuery,
    incrementUsage,
    isLoading,
  } = usePrescription();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showHomeopathicDisclaimer, setShowHomeopathicDisclaimer] = useState(false);

  const filteredTemplates = useMemo(() => {
    let templates = medicationTemplates;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }
    
    if (activeCategory) {
      templates = templates.filter((t) => t.category === activeCategory);
    }
    
    // Check if any filtered results are homeopathic
    if (templates.some((t) => t.source === "homeopathic")) {
      setShowHomeopathicDisclaimer(true);
    } else {
      setShowHomeopathicDisclaimer(false);
    }
    
    return templates;
  }, [medicationTemplates, searchQuery, activeCategory]);

  // Recently used
  const recentlyUsed = useMemo(() => {
    return [...medicationTemplates]
      .filter((t) => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }, [medicationTemplates]);

  const handleSelect = (template: MedicationTemplate) => {
    if (activeMedicationIndex === null) return;
    
    updateMedication(activeMedicationIndex, {
      name: template.name,
      dosage: template.dosage,
      duration: template.duration,
      instructions: template.instructions || "",
    });
    incrementUsage("medication", template._id);
  };

  const currentMedication =
    activeMedicationIndex !== null ? medications[activeMedicationIndex] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (activeMedicationIndex === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Click on a medication field to see suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Homeopathic disclaimer */}
      {showHomeopathicDisclaimer && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            This information is provided for documentation purposes only and does not constitute medical advice. For serious, acute, or potentially life-threatening conditions, patients should seek appropriate emergency or conventional medical care.
          </p>
        </div>
      )}

      {/* Recently used */}
      {recentlyUsed.length > 0 && !searchQuery && !activeCategory && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recently Used
          </h4>
          <div className="space-y-1">
            {recentlyUsed.map((template) => (
              <button
                key={template._id}
                type="button"
                onClick={() => handleSelect(template)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  currentMedication?.name === template.name
                    ? "bg-brand-100 border border-brand-300"
                    : "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-slate-900 truncate">
                    {template.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <SourceBadge source={template.source} />
                    {currentMedication?.name === template.name && (
                      <Check className="w-4 h-4 text-brand-600" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1.5">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                    {template.dosage}
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                    {template.duration}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeCategory === null
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {medicationCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* All medications */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No medications found. Type in the form to add a custom medication.
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template._id}
              type="button"
              onClick={() => handleSelect(template)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                currentMedication?.name === template.name
                  ? "bg-brand-100 border border-brand-300"
                  : "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-slate-900 truncate">
                  {template.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <SourceBadge source={template.source} />
                  {currentMedication?.name === template.name && (
                    <Check className="w-4 h-4 text-brand-600" />
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1.5">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                  {template.dosage}
                </span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                  {template.duration}
                </span>
                {template.instructions && (
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-40">
                    {template.instructions}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// Advice Panel
function AdvicePanel() {
  const {
    adviceTemplates,
    adviceCategories,
    advice,
    setAdvice,
    appendAdvice,
    searchQuery,
    incrementUsage,
    isLoading,
  } = usePrescription();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let templates = adviceTemplates;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }
    
    if (activeCategory) {
      templates = templates.filter((t) => t.category === activeCategory);
    }
    
    return templates;
  }, [adviceTemplates, searchQuery, activeCategory]);

  // Recently used
  const recentlyUsed = useMemo(() => {
    return [...adviceTemplates]
      .filter((t) => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }, [adviceTemplates]);

  const handleSelect = (template: AdviceTemplate, append = false) => {
    if (append) {
      appendAdvice(template.content);
    } else {
      setAdvice(template.content);
    }
    incrementUsage("advice", template._id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recently used */}
      {recentlyUsed.length > 0 && !searchQuery && !activeCategory && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recently Used
          </h4>
          <div className="space-y-1">
            {recentlyUsed.map((template) => (
              <div
                key={template._id}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-sm text-slate-900">
                      {template.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {template.content}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelect(template, true)}
                    className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 shrink-0"
                    title="Append to advice"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeCategory === null
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {adviceCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-500 flex items-center gap-1">
        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Click</span>
        to replace
        <span className="bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Plus className="w-3 h-3" />
        </span>
        to append
      </p>

      {/* All advice */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No advice templates found. Type in the form to add custom advice.
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template._id}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect(template)}
                  className="flex-1 text-left"
                >
                  <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                    {template.title}
                    {template.category && (
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {template.content}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(template, true)}
                  className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 shrink-0"
                  title="Append to advice"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Main QuickSelectPanel component
export default function QuickSelectPanel() {
  const { activeField, searchQuery, setSearchQuery } = usePrescription();

  const fieldConfig = {
    complaints: {
      title: "Chief Complaints",
      icon: "🩺",
      component: ComplaintsPanel,
    },
    diagnosis: {
      title: "Diagnosis",
      icon: "🔬",
      component: DiagnosisPanel,
    },
    medication: {
      title: "Medications",
      icon: "💊",
      component: MedicationPanel,
    },
    advice: {
      title: "Advice",
      icon: "📋",
      component: AdvicePanel,
    },
  };

  const config = activeField ? fieldConfig[activeField] : null;

  if (!config) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">Select a field to see suggestions</p>
      </div>
    );
  }

  const PanelComponent = config.component;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span>{config.icon}</span>
          {config.title}
        </h3>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${config.title.toLowerCase()}...`}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        <PanelComponent />
      </div>
    </div>
  );
}
