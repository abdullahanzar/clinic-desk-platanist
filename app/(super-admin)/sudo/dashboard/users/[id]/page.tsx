"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Loader2,
  Save,
  Trash2,
  Ban,
  CheckCircle,
  KeyRound,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface LoginHistory {
  loginAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface UserDetails {
  _id: string;
  clinicId: string;
  clinicName: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  loginHistory: LoginHistory[];
  createdAt: string;
  updatedAt: string;
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "doctor" as "doctor" | "frontdesk",
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/users/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sudo");
          return;
        }
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      setUser(data.user);
      setFormData({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
    } catch (err) {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/super-admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      setSuccessMessage("User updated successfully");
      fetchUser();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/super-admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setSuccessMessage(
        user.isActive ? "User access revoked" : "User access restored"
      );
      fetchUser();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        throw new Error("Failed to reset password");
      }

      setSuccessMessage("Password reset successfully");
      setShowPasswordReset(false);
      setNewPassword("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/super-admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      router.push("/sudo/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">User not found</p>
          <button
            onClick={() => router.push("/sudo/dashboard")}
            className="text-red-400 hover:text-red-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.push("/sudo/dashboard")}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{user.name}</h1>
              <p className="text-xs text-slate-400">User Management</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div
              className={`p-4 rounded-xl border ${
                user.isActive
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.isActive ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Ban className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        user.isActive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {user.isActive ? "Active Account" : "Revoked Account"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {user.isActive
                        ? "User can log in and access the system"
                        : "User cannot log in"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    user.isActive
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {user.isActive ? "Revoke Access" : "Restore Access"}
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "doctor" | "frontdesk",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="frontdesk">Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Clinic
                  </label>
                  <input
                    type="text"
                    value={user.clinicName}
                    disabled
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="flex items-center gap-2 px-4 py-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Login</span>
                  <span className="text-slate-300">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>

            {/* Login History */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Logins
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.loginHistory.length === 0 ? (
                  <p className="text-slate-500 text-sm">No login history</p>
                ) : (
                  user.loginHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-700/50 rounded-lg text-xs"
                    >
                      <p className="text-slate-300">
                        {new Date(entry.loginAt).toLocaleString()}
                      </p>
                      {entry.ipAddress && (
                        <p className="text-slate-500 truncate">
                          IP: {entry.ipAddress}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Password
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Set a new password for {user.name}
            </p>
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete User</h2>
                <p className="text-sm text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong>{user.name}</strong> (
              {user.email})? This will permanently remove the account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
