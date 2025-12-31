"use client";

import { X, Sparkles } from "lucide-react";
import { usePrescription } from "./prescription-context";
import QuickSelectPanel from "./quick-select-panel";

export default function SuggestionSidebar() {
  const { isSidebarOpen, setIsSidebarOpen, activeField } = usePrescription();

  return (
    <>
      {/* Desktop Sidebar - Always visible on lg+ screens */}
      <div className="hidden lg:block w-96 shrink-0">
        <div className="sticky top-4 bg-slate-50 rounded-2xl border border-slate-200 p-4 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900">Quick Suggestions</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <QuickSelectPanel />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          isSidebarOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out ${
            isSidebarOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ maxHeight: "85vh" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">Quick Suggestions</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 80px)" }}>
            <QuickSelectPanel />
          </div>
        </div>
      </div>

      {/* Mobile FAB to open sidebar */}
      {!isSidebarOpen && activeField && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-24 right-4 z-40 p-4 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-colors"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
