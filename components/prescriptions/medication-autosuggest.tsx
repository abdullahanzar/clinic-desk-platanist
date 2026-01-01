"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, X, Loader2, AlertTriangle, Pill, Leaf, User } from "lucide-react";

export interface MedicationSuggestion {
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

interface MedicationAutosuggestProps {
  value: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  };
  onChange: (medication: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }) => void;
  index: number;
  onRemove?: () => void;
  canRemove?: boolean;
}

const HOMEOPATHIC_DISCLAIMER =
  "This information is provided for documentation purposes only and does not constitute medical advice. For serious, acute, or potentially life-threatening conditions, patients should seek appropriate emergency or conventional medical care.";

const SourceBadge = ({ source }: { source: string }) => {
  switch (source) {
    case "allopathic":
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          <Pill className="w-3 h-3" />
          Allopathic
        </span>
      );
    case "homeopathic":
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
          <Leaf className="w-3 h-3" />
          Homeopathic
        </span>
      );
    case "custom":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
          <User className="w-3 h-3" />
          Custom
        </span>
      );
  }
};

interface MedicationAutosuggestProps {
  value: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  };
  onChange: (medication: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }) => void;
  index: number;
  onRemove?: () => void;
  canRemove?: boolean;
}

export default function MedicationAutosuggest({
  value,
  onChange,
  index,
  onRemove,
  canRemove = true,
}: MedicationAutosuggestProps) {
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when search query changes
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/templates/medications?search=${encodeURIComponent(query)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching medication suggestions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, fetchSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = async (suggestion: MedicationSuggestion) => {
    onChange({
      name: suggestion.name,
      dosage: suggestion.dosage,
      duration: suggestion.duration,
      instructions: suggestion.instructions || "",
    });
    setShowSuggestions(false);
    setSearchQuery("");
    setHighlightedIndex(-1);

    // Increment usage count
    try {
      await fetch(`/api/templates/medications/${suggestion._id}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing usage count:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          selectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3"
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
          #{index + 1}
        </span>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Medication Name with Autosuggest */}
        <div className="relative sm:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={value.name}
              onChange={(e) => {
                const newValue = e.target.value;
                onChange({ ...value, name: newValue });
                setSearchQuery(newValue);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => {
                if (value.name.length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Medication name (e.g., Tab. Paracetamol 500mg)"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-auto">
              {/* Homeopathic disclaimer if any homeopathic suggestions */}
              {suggestions.some((s) => s.source === "homeopathic") && (
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {HOMEOPATHIC_DISCLAIMER}
                  </p>
                </div>
              )}
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion._id}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-brand-50 border-b border-slate-100 last:border-b-0 ${
                    idx === highlightedIndex ? "bg-brand-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      {suggestion.name}
                    </span>
                    <SourceBadge source={suggestion.source} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                      {suggestion.dosage}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                      {suggestion.duration}
                    </span>
                    {suggestion.instructions && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {suggestion.instructions}
                      </span>
                    )}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-slate-500 mt-1">
                      {suggestion.category}
                    </div>
                  )}
                  {suggestion.description && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {suggestion.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showSuggestions &&
            suggestions.length === 0 &&
            searchQuery.length >= 2 &&
            !loading && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                <p className="text-sm text-slate-500 text-center">
                  No saved medications found. Type to create a custom entry.
                </p>
              </div>
            )}
        </div>

        {/* Other fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={value.dosage}
            onChange={(e) => onChange({ ...value, dosage: e.target.value })}
            placeholder="Dosage (e.g., 1-0-1)"
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <input
            type="text"
            value={value.duration}
            onChange={(e) => onChange({ ...value, duration: e.target.value })}
            placeholder="Duration (e.g., 5 days)"
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <input
            type="text"
            value={value.instructions || ""}
            onChange={(e) =>
              onChange({ ...value, instructions: e.target.value })
            }
            placeholder="Instructions (e.g., After food)"
            className="sm:col-span-2 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
