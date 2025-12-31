"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Users,
  Plus,
  Loader2,
  LogOut,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface Clinic {
  _id: string;
  name: string;
  slug: string;
  phone: string;
  email?: string;
  userCount: number;
  activeUserCount: number;
  createdAt: string;
}

interface User {
  _id: string;
  clinicId: string;
  clinicName: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clinics" | "users">("clinics");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [clinicsRes, usersRes] = await Promise.all([
        fetch("/api/super-admin/clinics"),
        fetch("/api/super-admin/users"),
      ]);

      if (!clinicsRes.ok || !usersRes.ok) {
        if (clinicsRes.status === 401 || usersRes.status === 401) {
          router.push("/sudo");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const clinicsData = await clinicsRes.json();
      const usersData = await usersRes.json();

      setClinics(clinicsData.clinics || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/super-admin/auth/logout", { method: "POST" });
    router.push("/sudo");
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user status");
      }

      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Super Admin</h1>
                <p className="text-xs text-slate-400">System Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{clinics.length}</p>
                <p className="text-sm text-slate-400">Total Clinics</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.isActive).length}
                </p>
                <p className="text-sm text-slate-400">Active Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("clinics")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "clinics"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Clinics
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Users
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {activeTab === "clinics" ? (
            <button
              onClick={() => setShowCreateClinic(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Clinic
            </button>
          ) : (
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New User
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : activeTab === "clinics" ? (
          /* Clinics Table */
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {clinics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No clinics found
                    </td>
                  </tr>
                ) : (
                  clinics.map((clinic) => (
                    <tr key={clinic._id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white font-medium">{clinic.name}</p>
                          {clinic.email && (
                            <p className="text-xs text-slate-400">{clinic.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
                          {clinic.slug}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{clinic.phone}</td>
                      <td className="px-4 py-4">
                        <span className="text-green-400">{clinic.activeUserCount}</span>
                        <span className="text-slate-500"> / {clinic.userCount}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {new Date(clinic.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => router.push(`/sudo/dashboard/clinics/${clinic._id}`)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Users Table */
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{user.clinicName}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.role === "doctor"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.isActive ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <Ban className="w-4 h-4" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                          <button
                            onClick={() =>
                              router.push(`/sudo/dashboard/users/${user._id}`)
                            }
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Clinic Modal */}
      {showCreateClinic && (
        <CreateClinicModal
          onClose={() => setShowCreateClinic(false)}
          onSuccess={() => {
            setShowCreateClinic(false);
            fetchData();
          }}
        />
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          clinics={clinics}
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Create Clinic Modal Component
function CreateClinicModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    clinicName: "",
    clinicSlug: "",
    phone: "",
    email: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    doctorName: "",
    doctorEmail: "",
    doctorPassword: "",
    // Public Profile
    publicProfileEnabled: false,
    qualifications: "",
    specialization: "",
    timings: "",
    aboutText: "",
    // Receipt settings
    footerText: "",
    receiptShareDurationMinutes: 10,
    // Tax Info
    gstin: "",
    pan: "",
    registrationNumber: "",
    showTaxOnReceipt: false,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: formData.clinicName,
          clinicSlug: formData.clinicSlug,
          phone: formData.phone,
          email: formData.email || undefined,
          website: formData.website || undefined,
          address: {
            line1: formData.addressLine1,
            line2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          doctorName: formData.doctorName,
          doctorEmail: formData.doctorEmail,
          doctorPassword: formData.doctorPassword,
          footerText: formData.footerText || undefined,
          receiptShareDurationMinutes: formData.receiptShareDurationMinutes,
          publicProfile: {
            enabled: formData.publicProfileEnabled,
            doctorName: formData.doctorName,
            qualifications: formData.qualifications,
            specialization: formData.specialization,
            timings: formData.timings,
            aboutText: formData.aboutText || undefined,
          },
          taxInfo:
            formData.gstin || formData.pan || formData.registrationNumber
              ? {
                  gstin: formData.gstin || undefined,
                  pan: formData.pan || undefined,
                  registrationNumber: formData.registrationNumber || undefined,
                  showTaxOnReceipt: formData.showTaxOnReceipt,
                }
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create clinic");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl my-8">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create New Clinic</h2>
          <p className="text-sm text-slate-400 mt-1">
            Set up a new clinic with doctor account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Clinic Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Clinic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      clinicName: e.target.value,
                      clinicSlug: generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="My Clinic"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clinicSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicSlug: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="my-clinic"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="9876543210"
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="clinic@example.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Address</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Near landmark"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Doctor Account */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Doctor Account
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.doctorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="doctor@clinic.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.doctorPassword}
                onChange={(e) =>
                  setFormData({ ...formData, doctorPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Min 6 characters"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={formData.qualifications}
                  onChange={(e) =>
                    setFormData({ ...formData, qualifications: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="MBBS, MD"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="General Physician"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Timings
              </label>
              <input
                type="text"
                value={formData.timings}
                onChange={(e) =>
                  setFormData({ ...formData, timings: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Mon-Sat: 10 AM - 1 PM, 5 PM - 8 PM"
              />
            </div>
          </div>

          {/* Optional Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">
              Optional Settings
            </h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Receipt Footer Text
              </label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) =>
                  setFormData({ ...formData, footerText: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Thank you for visiting! Get well soon."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publicProfile"
                checked={formData.publicProfileEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    publicProfileEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
              />
              <label htmlFor="publicProfile" className="text-sm text-slate-300">
                Enable Public Profile
              </label>
            </div>
          </div>

          {/* Tax Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">
              Tax Information (Optional)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) =>
                    setFormData({ ...formData, gstin: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="GST Number"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">PAN</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) =>
                    setFormData({ ...formData, pan: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="PAN Number"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Reg. No.
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Registration No."
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Clinic"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({
  clinics,
  onClose,
  onSuccess,
}: {
  clinics: Clinic[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    clinicId: "",
    name: "",
    email: "",
    password: "",
    role: "doctor" as "doctor" | "frontdesk",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create user");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create New User</h2>
          <p className="text-sm text-slate-400 mt-1">
            Add a user to an existing clinic
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Clinic *
            </label>
            <select
              required
              value={formData.clinicId}
              onChange={(e) =>
                setFormData({ ...formData, clinicId: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select a clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="user@clinic.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Role *</label>
            <select
              required
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
        </form>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
