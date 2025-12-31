import { redirect } from "next/navigation";
import { getSuperAdminSession, isSuperAdminConfigured } from "@/lib/auth/super-admin";

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if super admin is configured and authenticated
  if (!isSuperAdminConfigured()) {
    redirect("/");
  }

  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/sudo");
  }

  return <>{children}</>;
}
