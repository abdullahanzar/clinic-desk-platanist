import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // Protect billing routes - only doctors can access
  if (!session || session.role !== "doctor") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
