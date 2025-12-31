"use client";

import { useMemo, useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { usePrescription } from "./prescription-context";

export default function ChiefComplaintsSelector() {
  const {
    selectedComplaints,
    addComplaint,
    removeComplaint,
    setActiveField,
    setIsSidebarOpen,
  } = usePrescription();

  const [customComplaint, setCustomComplaint] = useState("");

  const handleAddCustom = () => {
    if (customComplaint.trim()) {
      addComplaint(customComplaint.trim());
      setCustomComplaint("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const handleFocus = () => {
    setActiveField("complaints");
    // Open sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected complaints as chips */}
      {selectedComplaints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedComplaints.map((complaint) => (
            <span
              key={complaint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-800 rounded-full text-sm font-medium"
            >
              {complaint}
              <button
                type="button"
                onClick={() => removeComplaint(complaint)}
                className="hover:bg-brand-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom complaint input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={customComplaint}
            onChange={(e) => setCustomComplaint(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Type complaint or tap to see suggestions..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400 text-sm"
          />
        </div>
        {customComplaint.trim() && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        )}
      </div>

      {/* Hint for mobile */}
      <p className="text-xs text-slate-500 lg:hidden">
        Tap the input to see quick suggestions →
      </p>
    </div>
  );
}
