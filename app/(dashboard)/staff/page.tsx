"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Stethoscope,
  Monitor,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Key,
} from "lucide-react";
import { PasswordResetDialog } from "@/components/staff/password-reset-dialog";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "doctor" | "frontdesk";
  isActive: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
}

interface MenuPosition {
  top: number;
  right: number;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<StaffMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });

      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) =>
            s.id === member.id ? { ...s, isActive: !s.isActive } : s
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
    setActiveMenu(null);
  };

  const handleOpenMenu = (memberId: string) => {
    if (activeMenu === memberId) {
      setActiveMenu(null);
      setMenuPosition(null);
      return;
    }

    const button = menuButtonRefs.current.get(memberId);
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setActiveMenu(memberId);
  };

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(member.id);
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== member.id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastLogin = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            Staff Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage front desk users and their access
          </p>
        </div>
        <Link
          href="/staff/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchQuery ? "No staff found" : "No staff members yet"}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Add your first front desk user to get started"}
          </p>
          {!searchQuery && (
            <Link
              href="/staff/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Last Login
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Logins
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member, index) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          member.role === "doctor"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {member.role === "doctor" ? (
                          <Stethoscope className="w-3.5 h-3.5" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{member.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.isActive ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatLastLogin(member.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {member.loginCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        ref={(el) => {
                          if (el) menuButtonRefs.current.set(member.id, el);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMenu(member.id);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredStaff.map((member) => (
              <div key={member.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.role === "doctor"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {member.role === "doctor" ? (
                          <Stethoscope className="w-3 h-3" />
                        ) : (
                          <Monitor className="w-3 h-3" />
                        )}
                        <span className="capitalize">{member.role}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Last login: {formatLastLogin(member.lastLoginAt)} •{" "}
                      {member.loginCount} logins
                    </p>
                  </div>
                  <button
                    ref={(el) => {
                      if (el) menuButtonRefs.current.set(`mobile-${member.id}`, el);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Use mobile prefix to differentiate from desktop
                      if (activeMenu === member.id) {
                        setActiveMenu(null);
                        setMenuPosition(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPosition({
                          top: rect.bottom + 4,
                          right: window.innerWidth - rect.right,
                        });
                        setActiveMenu(member.id);
                      }
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Dropdown Menu - Fixed Position */}
      {activeMenu && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setActiveMenu(null);
              setMenuPosition(null);
            }}
          />
          <div
            className="fixed z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            {(() => {
              const member = filteredStaff.find((s) => s.id === activeMenu);
              if (!member) return null;
              return (
                <>
                  <Link
                    href={`/staff/${member.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="w-4 h-4" />
                    View / Edit
                  </Link>
                  <button
                    onClick={() => {
                      setPasswordResetUser(member);
                      setActiveMenu(null);
                      setMenuPosition(null);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Key className="w-4 h-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {member.isActive ? (
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
                  {member.role !== "doctor" && (
                    <button
                      onClick={() => handleDelete(member)}
                      disabled={deletingId === member.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === member.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Password Reset Dialog */}
      {passwordResetUser && (
        <PasswordResetDialog
          user={passwordResetUser}
          onClose={() => setPasswordResetUser(null)}
        />
      )}
    </div>
  );
}
