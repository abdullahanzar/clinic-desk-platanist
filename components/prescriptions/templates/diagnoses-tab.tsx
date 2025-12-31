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
  Download,
  Lock,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface DiagnosisTemplate {
  _id: string;
  name: string;
  icdCode?: string;
  category?: string;
  description?: string;
  isDefault: boolean;
  usageCount: number;
}

interface DiagnosisStats {
  default: number;
  custom: number;
}

const SourceBadge = ({ isDefault }: { isDefault: boolean }) => {
  if (isDefault) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
          <FileText className="w-3 h-3" />
          Default
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
          <Lock className="w-2.5 h-2.5" />
        </span>
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
      <User className="w-3 h-3" />
      Custom
    </span>
  );
};

export default function DiagnosesTab() {
  const [templates, setTemplates] = useState<DiagnosisTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats state
  const [stats, setStats] = useState<DiagnosisStats | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DiagnosisTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    icdCode: "",
    category: "",
    description: "",
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/templates/diagnoses/seed");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const seedDefaultDiagnoses = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/templates/diagnoses/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      if (res.ok) {
        await fetchStats();
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error seeding diagnoses:", error);
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
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("skip", String((currentPage - 1) * ITEMS_PER_PAGE));

      const res = await fetch(`/api/templates/diagnoses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setCategories(data.categories || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching diagnoses:", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

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
      icdCode: "",
      category: "",
      description: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (template: DiagnosisTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      icdCode: template.icdCode || "",
      category: template.category || "",
      description: template.description || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Diagnosis name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingTemplate
        ? `/api/templates/diagnoses/${editingTemplate._id}`
        : "/api/templates/diagnoses";
      const method = editingTemplate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save diagnosis");
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
      const res = await fetch(`/api/templates/diagnoses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t._id !== id));
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete diagnosis");
        setTimeout(() => setDeleteError(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting diagnosis:", error);
      setDeleteError("Failed to delete diagnosis");
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
              <h4 className="text-sm font-medium text-slate-900 mb-2">Diagnosis Database</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-blue-700">
                  <FileText className="w-4 h-4" />
                  {stats.default} Default
                </span>
                <span className="inline-flex items-center gap-1.5 text-purple-700">
                  <User className="w-4 h-4" />
                  {stats.custom} Custom
                </span>
              </div>
            </div>
            {stats.default === 0 && (
              <button
                onClick={seedDefaultDiagnoses}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading diagnoses...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Load Default Diagnoses
                  </>
                )}
              </button>
            )}
          </div>
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
            Diagnosis Templates
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Save common diagnoses for quick selection
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Diagnosis
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
            placeholder="Search diagnoses..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
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
            No diagnoses saved
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            Add your commonly used diagnoses for quick access
          </p>
          <button
            onClick={openAddModal}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Add your first diagnosis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900">
                      {template.name}
                    </h4>
                    <SourceBadge isDefault={template.isDefault} />
                  </div>
                  {template.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs mb-1">
                      {template.category}
                    </span>
                  )}
                  {template.icdCode && (
                    <p className="text-xs text-slate-500 mt-1">
                      ICD-10: {template.icdCode}
                    </p>
                  )}
                  {template.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Used {template.usageCount} time
                    {template.usageCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!template.isDefault && (
                    <>
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === template._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(template._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(template._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} diagnoses
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTemplate ? "Edit Diagnosis" : "Add Diagnosis"}
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
                  Diagnosis Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Acute Upper Respiratory Infection"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ICD-10 Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.icdCode}
                  onChange={(e) =>
                    setFormData({ ...formData, icdCode: e.target.value })
                  }
                  placeholder="e.g., J06.9"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Respiratory, Cardiovascular, etc."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  list="diagnosis-categories"
                />
                <datalist id="diagnosis-categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Brief description of the diagnosis..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                />
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
                    {editingTemplate ? "Update" : "Save"} Diagnosis
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
