"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Stethoscope,
  Monitor,
  Clock,
  Calendar,
  Globe,
  Smartphone,
  Save,
  Loader2,
  Key,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";
import { PasswordResetDialog } from "@/components/staff/password-reset-dialog";

interface LoginHistoryEntry {
  loginAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface StaffDetails {
  id: string;
  name: string;
  email: string;
  role: "doctor" | "frontdesk";
  isActive: boolean;
  lastLoginAt: string | null;
  loginHistory: LoginHistoryEntry[];
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [staff, setStaff] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      const res = await fetch(`/api/staff/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
        });
      } else if (res.status === 404) {
        router.push("/staff");
      }
    } catch (error) {
      console.error("Error fetching staff details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!staff) return;
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }

      setStaff((prev) =>
        prev ? { ...prev, ...formData, updatedAt: new Date().toISOString() } : null
      );
    } catch (err) {
      console.error("Error saving:", err);
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!staff) return;

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staff.isActive }),
      });

      if (res.ok) {
        setStaff((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;
    if (
      !confirm(
        `Are you sure you want to delete ${staff.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/staff");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return "Unknown Device";
    if (ua.includes("Mobile")) return "Mobile Browser";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Browser";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">User not found</p>
        <Link href="/staff" className="text-brand-600 hover:underline mt-2 inline-block">
          Back to Staff
        </Link>
      </div>
    );
  }

  const hasChanges = formData.name !== staff.name || formData.email !== staff.email;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Staff</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-7 h-7 text-brand-600" />
              {staff.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  staff.role === "doctor"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {staff.role === "doctor" ? (
                  <Stethoscope className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                <span className="capitalize">{staff.role}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  staff.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {staff.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          {staff.role !== "doctor" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleActive}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  staff.isActive
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {staff.isActive ? (
                  <>
                    <UserX className="w-4 h-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Key className="w-4 h-4" />
                Reset Password
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Account Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  disabled={staff.role === "doctor"}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  disabled={staff.role === "doctor"}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {staff.role !== "doctor" && hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            )}

            {/* Account Info */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                Created: {formatDate(staff.createdAt)}
              </div>
              {staff.createdByName && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  Created by: {staff.createdByName}
                </div>
              )}
              {staff.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Last login: {formatDate(staff.lastLoginAt)}
                </div>
              )}
            </div>

            {/* Delete Button */}
            {staff.role !== "doctor" && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Login History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Login History
          </h2>
          {staff.loginHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">No login history yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {staff.loginHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(entry.loginAt)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {entry.ipAddress && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {entry.ipAddress}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {parseUserAgent(entry.userAgent)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Dialog */}
      {showPasswordDialog && (
        <PasswordResetDialog
          user={{ id: staff.id, name: staff.name }}
          onClose={() => setShowPasswordDialog(false)}
        />
      )}
    </div>
  );
}
