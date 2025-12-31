"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Check,
  AlertCircle,
  Pill,
  Leaf,
  User,
  AlertTriangle,
  Download,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface MedicationTemplate {
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

interface MedicationStats {
  allopathic: number;
  homeopathic: number;
  custom: number;
}

const HOMEOPATHIC_DISCLAIMER = "Homeopathic remedies are included for patient preference and historical use. They are not supported by robust clinical evidence for most conditions. For serious, acute, or potentially life-threatening problems, always seek conventional medical care. This list is informational — dosing patterns shown are typical retail potencies and not individualized medical advice.";

const SourceBadge = ({ source, isDefault }: { source: string; isDefault: boolean }) => {
  const badge = (() => {
    switch (source) {
      case "allopathic":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
            <Pill className="w-3 h-3" />
            Allopathic
          </span>
        );
      case "homeopathic":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
            <Leaf className="w-3 h-3" />
            Homeopathic
          </span>
        );
      case "custom":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
            <User className="w-3 h-3" />
            Custom
          </span>
        );
    }
  })();

  return (
    <div className="flex items-center gap-1.5">
      {badge}
      {isDefault && (
        <span className="inline-flex items-center gap-0.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
          <Lock className="w-2.5 h-2.5" />
          Default
        </span>
      )}
    </div>
  );
};

export default function MedicationsTab() {
  const [templates, setTemplates] = useState<MedicationTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("allopathic");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats state
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MedicationTemplate | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    duration: "",
    instructions: "",
    category: "",
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/templates/medications/seed");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const seedDefaultMedications = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/templates/medications/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      if (res.ok) {
        await fetchStats();
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error seeding medications:", error);
    } finally {
      setSeeding(false);
    }
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSource) params.set("source", selectedSource);
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("skip", String((currentPage - 1) * ITEMS_PER_PAGE));

      const res = await fetch(`/api/templates/medications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setCategories(data.categories || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedSource, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSource]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const debounce = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(debounce);
  }, [fetchTemplates]);

  // Handle click outside for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      dosage: "",
      duration: "",
      instructions: "",
      category: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (template: MedicationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      dosage: template.dosage,
      duration: template.duration,
      instructions: template.instructions || "",
      category: template.category || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.dosage.trim() || !formData.duration.trim()) {
      setError("Name, dosage, and duration are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingTemplate
        ? `/api/templates/medications/${editingTemplate._id}`
        : "/api/templates/medications";
      const method = editingTemplate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save medication");
        return;
      }

      setShowModal(false);
      fetchTemplates();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/medications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t._id !== id));
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete medication");
        setTimeout(() => setDeleteError(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      setDeleteError("Failed to delete medication");
      setTimeout(() => setDeleteError(null), 3000);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="p-5 sm:p-6">
      {/* Stats & Seed Section */}
      {stats && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">Medication Database</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-blue-700">
                  <Pill className="w-4 h-4" />
                  {stats.allopathic} Allopathic
                </span>
                <span className="inline-flex items-center gap-1.5 text-green-700">
                  <Leaf className="w-4 h-4" />
                  {stats.homeopathic} Homeopathic
                </span>
                <span className="inline-flex items-center gap-1.5 text-purple-700">
                  <User className="w-4 h-4" />
                  {stats.custom} Custom
                </span>
              </div>
            </div>
            {(stats.allopathic === 0 && stats.homeopathic === 0) && (
              <button
                onClick={seedDefaultMedications}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading medications...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Load Default Medications
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Homeopathic Disclaimer - only show when filtering by homeopathic */}
      {selectedSource === "homeopathic" && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            {HOMEOPATHIC_DISCLAIMER}
          </p>
        </div>
      )}

      {/* Delete error toast */}
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Medication Templates
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Save frequently prescribed medications for quick access
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Medication
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medications..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="flex-shrink-0 w-full sm:w-36 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">All Types</option>
          <option value="allopathic">Allopathic</option>
          <option value="homeopathic">Homeopathic</option>
          <option value="custom">Custom</option>
        </select>
        {categories.length > 0 && (
          <div ref={categoryRef} className="relative flex-shrink-0 w-full sm:w-56">
            <div
              className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded-xl text-sm cursor-pointer hover:border-slate-400 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white"
              onClick={() => setShowCategoryDropdown(true)}
            >
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={showCategoryDropdown ? categorySearch : (selectedCategory || "")}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="All Categories"
                className="flex-1 min-w-0 outline-none bg-transparent text-slate-900 placeholder:text-slate-500"
              />
              {selectedCategory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory("");
                    setCategorySearch("");
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showCategoryDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setCategorySearch("");
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    !selectedCategory ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategorySearch("");
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        selectedCategory === cat ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No categories found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-medium text-slate-900 mb-1">
            No medications saved
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            Add your frequently prescribed medications for quick access
          </p>
          <button
            onClick={openAddModal}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Add your first medication
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-medium text-slate-900">
                      {template.name}
                    </h4>
                    <SourceBadge source={template.source} isDefault={template.isDefault} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs">
                      {template.dosage}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs">
                      {template.duration}
                    </span>
                    {template.instructions && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs">
                        {template.instructions}
                      </span>
                    )}
                    {template.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs">
                        {template.category}
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Used {template.usageCount} time
                    {template.usageCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!template.isDefault && (
                    <>
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirm === template._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(template._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(template._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} medications
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-600 px-2">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
              disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTemplate ? "Edit Medication" : "Add Medication"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Tab. Paracetamol 500mg"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage: e.target.value })
                    }
                    placeholder="e.g., 1-0-1"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="e.g., 5 days"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Instructions
                </label>
                <input
                  type="text"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  placeholder="e.g., After food"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Analgesic, Antibiotic, etc."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  list="medication-categories"
                />
                <datalist id="medication-categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingTemplate ? "Update" : "Save"} Medication
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
