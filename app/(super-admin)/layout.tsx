import { redirect } from "next/navigation";
import { isSuperAdminConfigured } from "@/lib/auth/super-admin";
import { AppBackButton } from "@/components/layout/app-back-button";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if super admin is configured
  if (!isSuperAdminConfigured()) {
    redirect("/");
  }

  return (
    <>
      <AppBackButton
        defaultFallbackHref="/login"
        variant="inverse"
        className="fixed left-4 top-4 z-40"
      />
      {children}
    </>
  );
}
