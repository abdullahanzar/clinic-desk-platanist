"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Receipt,
  Loader2,
  Save,
  ChevronLeft,
  User,
  Clock,
  Stethoscope,
} from "lucide-react";

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  headerText: string;
  footerText: string;
  taxInfo: {
    gstin: string;
    pan: string;
    registrationNumber: string;
    sacCode: string;
    showTaxOnReceipt: boolean;
  };
  publicProfile: {
    enabled: boolean;
    doctorName: string;
    qualifications: string;
    specialization: string;
    timings: string;
    aboutText?: string;
  };
  receiptShareDurationMinutes: number;
}

export default function ClinicSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "tax" | "branding" | "profile">("general");

  const [clinic, setClinic] = useState<ClinicData | null>(null);

  // Fetch clinic data on mount
  useEffect(() => {
    fetchClinic();
  }, []);

  const fetchClinic = async () => {
    try {
      const res = await fetch("/api/clinic");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch clinic details");
        return;
      }

      setClinic(data.clinic);
    } catch (err) {
      console.error("Error fetching clinic:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save clinic settings");
        return;
      }

      setClinic(data.clinic);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch (err) {
      console.error("Error saving clinic:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateClinic = (field: string, value: unknown) => {
    if (!clinic) return;
    setClinic({ ...clinic, [field]: value });
  };

  const updateAddress = (field: string, value: string) => {
    if (!clinic) return;
    setClinic({
      ...clinic,
      address: { ...clinic.address, [field]: value },
    });
  };

  const updateTaxInfo = (field: string, value: string | boolean) => {
    if (!clinic) return;
    setClinic({
      ...clinic,
      taxInfo: { ...clinic.taxInfo, [field]: value },
    });
  };

  const updatePublicProfile = (field: string, value: string | boolean) => {
    if (!clinic) return;
    setClinic({
      ...clinic,
      publicProfile: { ...clinic.publicProfile, [field]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load clinic settings</p>
      </div>
    );
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Building2 },
    { id: "tax" as const, label: "Tax & Legal", icon: Receipt },
    { id: "branding" as const, label: "Branding", icon: FileText },
    { id: "profile" as const, label: "Public Profile", icon: User },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600" />
              Clinic Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Configure your clinic details, tax information, and branding
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm border border-emerald-200 dark:border-emerald-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clinic.name}
                  onChange={(e) => updateClinic("name", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter clinic name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={clinic.phone}
                  onChange={(e) => updateClinic("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={clinic.email}
                  onChange={(e) => updateClinic("email", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="clinic@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website URL
                </label>
                <input
                  type="url"
                  value={clinic.website}
                  onChange={(e) => updateClinic("website", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="https://www.yourclinic.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={clinic.address.line1}
                  onChange={(e) => updateAddress("line1", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={clinic.address.line2 || ""}
                  onChange={(e) => updateAddress("line2", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={clinic.address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={clinic.address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={clinic.address.pincode}
                  onChange={(e) => updateAddress("pincode", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              Receipt Sharing
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                QR Share Duration (minutes)
              </label>
              <input
                type="number"
                value={clinic.receiptShareDurationMinutes}
                onChange={(e) => updateClinic("receiptShareDurationMinutes", Number(e.target.value))}
                min={1}
                max={60}
                className="w-32 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                How long receipts remain visible on the QR display (1-60 minutes)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Tab */}
      {activeTab === "tax" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            Tax & Registration Information
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            This information will be displayed on receipts when enabled. All fields are optional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                GSTIN
              </label>
              <input
                type="text"
                value={clinic.taxInfo.gstin}
                onChange={(e) => updateTaxInfo("gstin", e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">15-character GST Identification Number</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                value={clinic.taxInfo.pan}
                onChange={(e) => updateTaxInfo("pan", e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                placeholder="AAAAA0000A"
                maxLength={10}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">10-character PAN</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Registration Number
              </label>
              <input
                type="text"
                value={clinic.taxInfo.registrationNumber}
                onChange={(e) => updateTaxInfo("registrationNumber", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Clinic/Medical registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SAC Code
              </label>
              <input
                type="text"
                value={clinic.taxInfo.sacCode}
                onChange={(e) => updateTaxInfo("sacCode", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                placeholder="999312"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Service Accounting Code for healthcare services</p>
            </div>
            <div className="sm:col-span-2 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clinic.taxInfo.showTaxOnReceipt}
                  onChange={(e) => updateTaxInfo("showTaxOnReceipt", e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Show tax information on receipts</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Display GSTIN, PAN, and registration details on printed receipts</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Receipt Branding
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={clinic.logoUrl}
                  onChange={(e) => updateClinic("logoUrl", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">URL to your clinic logo (displayed on receipts)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Header Text
                </label>
                <input
                  type="text"
                  value={clinic.headerText}
                  onChange={(e) => updateClinic("headerText", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Your tagline or header message"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Displayed at the top of receipts</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Footer Text
                </label>
                <textarea
                  value={clinic.footerText}
                  onChange={(e) => updateClinic("footerText", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="Thank you for visiting! Get well soon."
                  rows={3}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Displayed at the bottom of receipts</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Receipt Preview</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-sm mx-auto">
              <div className="text-center border-b border-slate-200 pb-3 mb-3">
                <h4 className="font-bold text-lg text-slate-900">{clinic.name || "Clinic Name"}</h4>
                {clinic.headerText && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{clinic.headerText}</p>
                )}
                {clinic.address.line1 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{clinic.address.line1}, {clinic.address.city}</p>
                )}
                {clinic.phone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ph: {clinic.phone}</p>
                )}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                [Receipt content here]
              </div>
              {clinic.taxInfo.showTaxOnReceipt && (clinic.taxInfo.gstin || clinic.taxInfo.registrationNumber) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 pt-2 mt-2">
                  {clinic.taxInfo.gstin && <p>GSTIN: {clinic.taxInfo.gstin}</p>}
                  {clinic.taxInfo.registrationNumber && <p>Reg. No: {clinic.taxInfo.registrationNumber}</p>}
                </div>
              )}
              {clinic.footerText && (
                <div className="text-center border-t border-slate-200 pt-3 mt-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">{clinic.footerText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-brand-600" />
            Doctor&apos;s Public Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            This information can be displayed on your public clinic page for patients.
          </p>
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clinic.publicProfile.enabled}
                  onChange={(e) => updatePublicProfile("enabled", e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Enable public profile</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allow patients to view your clinic information online</p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Doctor Name
              </label>
              <input
                type="text"
                value={clinic.publicProfile.doctorName}
                onChange={(e) => updatePublicProfile("doctorName", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Qualifications
              </label>
              <input
                type="text"
                value={clinic.publicProfile.qualifications}
                onChange={(e) => updatePublicProfile("qualifications", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="MBBS, MD (General Medicine)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Specialization
              </label>
              <input
                type="text"
                value={clinic.publicProfile.specialization}
                onChange={(e) => updatePublicProfile("specialization", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="General Physician, Diabetologist"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Clinic Timings
              </label>
              <input
                type="text"
                value={clinic.publicProfile.timings}
                onChange={(e) => updatePublicProfile("timings", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Mon-Sat: 10am-1pm, 5pm-8pm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                About / Description
              </label>
              <textarea
                value={clinic.publicProfile.aboutText || ""}
                onChange={(e) => updatePublicProfile("aboutText", e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                placeholder="Brief description about your practice..."
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Save Button */}
      <div className="sm:hidden mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
