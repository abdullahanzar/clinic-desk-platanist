"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Pill,
  ClipboardList,
} from "lucide-react";

type UploadType = "medications" | "advice";

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  totalProcessed: number;
  errors?: { row: number; error: string }[];
  message?: string;
}

export default function BulkUploadTab() {
  const [uploadType, setUploadType] = useState<UploadType>("medications");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, string>[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls') &&
        !selectedFile.name.endsWith('.csv')) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);

    // Parse the file for preview
    await parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      // For CSV files
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const rows = text.split('\n').filter(row => row.trim());
        if (rows.length < 2) {
          setError("File must have a header row and at least one data row");
          return;
        }

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const data = rows.slice(1).map(row => {
          const values = parseCSVRow(row);
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = values[i]?.trim() || "";
          });
          return obj;
        });

        setParsedData(data);
        setShowPreview(true);
        return;
      }

      // For Excel files, we'll use the server to parse
      // Store the file and show upload button
      setParsedData(null);
      setShowPreview(false);
    } catch (err) {
      console.error("Error parsing file:", err);
      setError("Failed to parse file. Please check the format.");
    }
  };

  // Parse CSV row handling quoted values
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      // Read file and convert to JSON
      let data: Record<string, string>[] = [];

      if (parsedData) {
        data = parsedData;
      } else {
        // For Excel files, we need to parse on client side using xlsx library
        // Since we don't have xlsx library, we'll parse CSV only for now
        // or send the file to be parsed server-side
        
        // For now, let's require CSV format or parsed data
        if (!file.name.endsWith('.csv')) {
          setError("Please use CSV format for upload. Download the template below.");
          setUploading(false);
          return;
        }

        const text = await file.text();
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        data = rows.slice(1).map(row => {
          const values = parseCSVRow(row);
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = values[i]?.trim() || "";
          });
          return obj;
        });
      }

      const endpoint = uploadType === "medications"
        ? "/api/templates/medications/bulk"
        : "/api/templates/advice/bulk";

      const bodyKey = uploadType === "medications" ? "medications" : "advice";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: data }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to import data");
        return;
      }

      setResult(result);
      setFile(null);
      setParsedData(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = "";
    let filename = "";

    if (uploadType === "medications") {
      csvContent = `name,dosage,duration,instructions,category
Tab. Paracetamol 500mg,1-0-1,5 days,After food,Analgesic
Tab. Amoxicillin 500mg,1-1-1,7 days,After food,Antibiotic
Syr. Cough Mixture,5ml TDS,5 days,After food,Antitussive`;
      filename = "medications_template.csv";
    } else {
      csvContent = `title,content,category
Fever Care,"Rest adequately, drink plenty of fluids, take medications as prescribed",Fever
Diet Advice,"Avoid oily and spicy food, eat light meals, stay hydrated",Diet
Follow-up,"Come for follow-up if symptoms persist or worsen after 3 days",General`;
      filename = "advice_template.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setShowPreview(false);
    setError("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-5 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Bulk Upload Templates
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Import multiple medications or advice templates from a CSV file
        </p>
      </div>

      {/* Upload Type Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setUploadType("medications");
            clearFile();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
            uploadType === "medications"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Pill className="w-5 h-5" />
          Medications
        </button>
        <button
          onClick={() => {
            setUploadType("advice");
            clearFile();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
            uploadType === "advice"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Advice
        </button>
      </div>

      {/* Template Download */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-medium text-slate-900 mb-2">
          1. Download Template
        </h4>
        <p className="text-sm text-slate-500 mb-3">
          Download the CSV template, fill in your data, and upload.
        </p>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download {uploadType === "medications" ? "Medications" : "Advice"} Template
        </button>

        {/* Column info */}
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-700 mb-2">Required columns:</p>
          {uploadType === "medications" ? (
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• <code className="bg-slate-200 px-1 rounded">name</code> - Medication name (required)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">dosage</code> - Dosage pattern (required)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">duration</code> - Duration (required)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">instructions</code> - Usage instructions (optional)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">category</code> - Category for grouping (optional)</li>
            </ul>
          ) : (
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• <code className="bg-slate-200 px-1 rounded">title</code> - Short title (required)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">content</code> - Full advice text (required)</li>
              <li>• <code className="bg-slate-200 px-1 rounded">category</code> - Category for grouping (optional)</li>
            </ul>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-900 mb-2">
          2. Upload File
        </h4>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className={`flex items-start gap-2 p-4 rounded-lg text-sm mb-4 ${
            result.imported > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}>
            {result.imported > 0 ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {result.imported > 0 
                  ? `Successfully imported ${result.imported} ${uploadType}!`
                  : result.message || "No new items imported"}
              </p>
              {result.skipped > 0 && (
                <p className="mt-1">Skipped {result.skipped} duplicate(s)</p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errors:</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        {err.row > 0 ? `Row ${err.row}: ` : ""}{err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
          >
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500">CSV files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {parsedData && ` • ${parsedData.length} rows`}
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            {showPreview && parsedData && parsedData.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Preview (first 3 rows):
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        {Object.keys(parsedData[0]).map((key) => (
                          <th
                            key={key}
                            className="px-2 py-1.5 text-left font-medium text-slate-700 whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              className="px-2 py-1.5 text-slate-600 whitespace-nowrap max-w-[200px] truncate"
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {uploadType === "medications" ? "Medications" : "Advice"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use the CSV template to ensure correct column formatting</li>
          <li>• Duplicate entries (matching by name/title) will be skipped</li>
          <li>• For best results, keep category names consistent</li>
          <li>• You can import up to 500 rows at once</li>
        </ul>
      </div>
    </div>
  );
}
