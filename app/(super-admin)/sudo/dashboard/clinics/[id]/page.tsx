"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Loader2,
  Save,
  Trash2,
  Ban,
  CheckCircle,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

interface ClinicUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface ClinicDetails {
  _id: string;
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
  email?: string;
  website?: string;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  taxInfo?: {
    gstin?: string;
    pan?: string;
    registrationNumber?: string;
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
  createdAt: string;
  updatedAt: string;
}

export default function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicDetails | null>(null);
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<ClinicDetails>>({});

  useEffect(() => {
    fetchClinic();
  }, [id]);

  const fetchClinic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/clinics/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sudo");
          return;
        }
        throw new Error("Failed to fetch clinic");
      }
      const data = await res.json();
      setClinic(data.clinic);
      setUsers(data.users);
      setFormData(data.clinic);
    } catch (err) {
      setError("Failed to load clinic");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/super-admin/clinics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update clinic");
      }

      setSuccessMessage("Clinic updated successfully");
      fetchClinic();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/super-admin/clinics/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete clinic");
      }

      router.push("/sudo/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      fetchClinic();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Clinic not found</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.push("/sudo/dashboard")}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{clinic.name}</h1>
              <p className="text-xs text-slate-400">Clinic Management</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {/* Clinic Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Clinic Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
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
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Address */}
              <h3 className="text-sm font-medium text-slate-300 mt-6 mb-3">
                Address
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={formData.address?.line1 || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address!, line1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Address Line 2"
                  value={formData.address?.line2 || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address!, line2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, city: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address!, state: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={formData.address?.pincode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address!,
                          pincode: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
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

            {/* Public Profile */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Public Profile
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="publicEnabled"
                    checked={formData.publicProfile?.enabled || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publicProfile: {
                          ...formData.publicProfile!,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="publicEnabled" className="text-sm text-slate-300">
                    Enable Public Profile
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={formData.publicProfile?.doctorName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publicProfile: {
                            ...formData.publicProfile!,
                            doctorName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      value={formData.publicProfile?.qualifications || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publicProfile: {
                            ...formData.publicProfile!,
                            qualifications: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.publicProfile?.specialization || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publicProfile: {
                            ...formData.publicProfile!,
                            specialization: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Timings
                    </label>
                    <input
                      type="text"
                      value={formData.publicProfile?.timings || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publicProfile: {
                            ...formData.publicProfile!,
                            timings: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({users.length})
              </h2>
              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-slate-500 text-sm">No users found</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              user.role === "doctor"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-purple-500/20 text-purple-400"
                            }`}
                          >
                            {user.role}
                          </span>
                          {!user.isActive && (
                            <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                              Revoked
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleToggleUserStatus(user._id, user.isActive)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive
                            ? "text-red-400 hover:bg-red-500/10"
                            : "text-green-400 hover:bg-green-500/10"
                        }`}
                        title={user.isActive ? "Revoke Access" : "Restore Access"}
                      >
                        {user.isActive ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Metadata
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-300">
                    {new Date(clinic.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Updated</span>
                  <span className="text-slate-300">
                    {new Date(clinic.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID</span>
                  <code className="text-slate-400 text-xs">{clinic._id}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete Clinic</h2>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong>{clinic.name}</strong> and
              all its {users.length} users? This will permanently remove all data.
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
                Delete Clinic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
