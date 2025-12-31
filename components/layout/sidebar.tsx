"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/types";
import { LayoutDashboard, Users, Receipt, UserPlus, LogOut, Stethoscope, Monitor, Pill } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/visits", label: "Visits", icon: Users },
    { href: "/receipts", label: "Receipts", icon: Receipt },
  ];

  // Add role-specific items
  if (role === "frontdesk") {
    navItems.splice(2, 0, { href: "/visits/new", label: "New Visit", icon: UserPlus });
  }

  // Add doctor-specific items
  if (role === "doctor") {
    navItems.push({ href: "/templates", label: "Rx Templates", icon: Pill });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Image
                src="/platanist_clinic_desk_minimal.png"
                alt="Clinic Desk Logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Clinic Desk</h1>
              <p className="text-xs text-slate-500">by Platanist</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-5 py-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
            {role === "doctor" ? <Stethoscope className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span className="capitalize">{role}</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-brand-50 text-brand-700 font-medium shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md">
              <Image
                src="/platanist_clinic_desk_minimal.png"
                alt="Logo"
                width={24}
                height={24}
                className="rounded"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Clinic Desk</h1>
              <span className="text-xs text-brand-600 capitalize">{role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb">
        <ul className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? "text-brand-600"
                      : "text-slate-500"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
