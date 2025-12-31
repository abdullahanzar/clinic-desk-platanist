"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Plus, Check } from "lucide-react";

export interface AdviceSuggestion {
  _id: string;
  title: string;
  content: string;
  category?: string;
  usageCount: number;
}

interface AdviceAutosuggestProps {
  value: string;
  onChange: (advice: string) => void;
  placeholder?: string;
}

export default function AdviceAutosuggest({
  value,
  onChange,
  placeholder = "Rest, drink plenty of fluids...",
}: AdviceAutosuggestProps) {
  const [suggestions, setSuggestions] = useState<AdviceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedAdvice, setSelectedAdvice] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/templates/advice?search=${encodeURIComponent(query)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching advice suggestions:", error);
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

  // Fetch initial suggestions on focus
  useEffect(() => {
    if (showSuggestions && suggestions.length === 0) {
      fetchSuggestions("");
    }
  }, [showSuggestions, suggestions.length, fetchSuggestions]);

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

  const appendAdvice = async (suggestion: AdviceSuggestion) => {
    // Append or replace based on current content
    const newValue = value.trim()
      ? `${value.trim()}\n\n${suggestion.content}`
      : suggestion.content;
    onChange(newValue);
    
    // Mark as selected
    setSelectedAdvice((prev) => new Set(prev).add(suggestion._id));

    // Increment usage count
    try {
      await fetch(`/api/templates/advice/${suggestion._id}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing usage count:", error);
    }
  };

  const replaceAdvice = async (suggestion: AdviceSuggestion) => {
    onChange(suggestion.content);
    setShowSuggestions(false);
    setSelectedAdvice(new Set([suggestion._id]));

    // Increment usage count
    try {
      await fetch(`/api/templates/advice/${suggestion._id}`, {
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
        if (e.altKey) {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        if (e.altKey) {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;
      case "Enter":
        if (e.altKey && highlightedIndex >= 0) {
          e.preventDefault();
          appendAdvice(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Bar */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search saved advice templates..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                Click to replace • Click{" "}
                <Plus className="w-3 h-3 inline" /> to append
              </p>
            </div>
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion._id}
                className={`px-3 py-2 border-b border-slate-100 last:border-b-0 ${
                  idx === highlightedIndex ? "bg-brand-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => replaceAdvice(suggestion)}
                    className="flex-1 text-left hover:text-brand-600"
                  >
                    <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                      {suggestion.title}
                      {selectedAdvice.has(suggestion._id) && (
                        <Check className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {suggestion.content}
                    </div>
                    {suggestion.category && (
                      <div className="text-xs text-brand-600 mt-1">
                        {suggestion.category}
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => appendAdvice(suggestion)}
                    className="p-1.5 rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 flex-shrink-0"
                    title="Append to advice"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions &&
          suggestions.length === 0 &&
          searchQuery.length >= 1 &&
          !loading && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
              <p className="text-sm text-slate-500 text-center">
                No saved advice found. Type in the box below to create custom
                advice.
              </p>
            </div>
          )}
      </div>

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}
