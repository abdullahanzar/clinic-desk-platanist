"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/types";
import { ThemeToggle } from "@/components/theme";
import { LayoutDashboard, Users, Receipt, LogOut, Stethoscope, Monitor, Pill, DollarSign, UserCog, Settings, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  role: UserRole;
  clinicName?: string;
  doctorName?: string;
}

export function Sidebar({ role, clinicName, doctorName }: SidebarProps) {
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

  // Add doctor-specific items
  if (role === "doctor") {
    navItems.push({ href: "/billing", label: "Billing", icon: DollarSign });
    navItems.push({ href: "/templates", label: "Rx Templates", icon: Pill });
    navItems.push({ href: "/staff", label: "Staff", icon: UserCog });
    navItems.push({ href: "/settings", label: "Settings", icon: Settings });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed inset-y-0 left-0 z-30">
        {/* Clinic Branding */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={clinicName || "Clinic Desk"}>
                {clinicName || "Clinic Desk"}
              </h1>
              {doctorName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={doctorName}>
                  {doctorName}
                </p>
              )}
              {!doctorName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">by Platanist</p>
              )}
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-5 py-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
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
                        ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-medium shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
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

        {/* Theme Toggle & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Theme</span>
            <ThemeToggle variant="compact" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={clinicName || "Clinic Desk"}>
                {clinicName || "Clinic Desk"}
              </h1>
              <span className="text-xs text-brand-600 dark:text-brand-400 capitalize">{role}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle variant="compact" />
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <ul className="flex items-center justify-around px-1 py-1.5 overflow-x-auto scrollbar-hide">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href} className="flex-shrink-0">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950"
                      : "text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                  <span className="text-[10px] font-medium leading-tight truncate max-w-[56px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
          {/* More menu for additional items on mobile */}
          {navItems.length > 5 && (
            <li className="flex-shrink-0">
              <Link
                href={navItems[5].href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-lg transition-all ${
                  navItems.slice(5).some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
                    ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950"
                    : "text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">More</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
