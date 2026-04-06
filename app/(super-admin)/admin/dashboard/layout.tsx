import { redirect } from "next/navigation";
import { getSuperAdminSession, isSuperAdminConfigured } from "@/lib/auth/super-admin";

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSuperAdminConfigured()) {
    redirect("/");
  }

  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/admin");
  }

  if (session.mustChangeCredentials) {
    redirect("/admin/change-credentials");
  }

  return <>{children}</>;
}
