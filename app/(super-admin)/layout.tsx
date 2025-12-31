import { redirect } from "next/navigation";
import { getSuperAdminSession, isSuperAdminConfigured } from "@/lib/auth/super-admin";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if super admin is configured
  if (!isSuperAdminConfigured()) {
    redirect("/");
  }

  return <>{children}</>;
}
