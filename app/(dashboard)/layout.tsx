import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClinicsCollection } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch clinic data for sidebar branding
  const clinics = await getClinicsCollection();
  const clinic = await clinics.findOne({ _id: new ObjectId(session.clinicId) });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Sidebar 
        role={session.role} 
        clinicName={clinic?.name}
        doctorName={clinic?.publicProfile?.doctorName}
      />
      {/* Desktop: offset for sidebar, Mobile: offset for header and bottom nav */}
      <main className="lg:ml-64 pt-16 pb-24 lg:pt-0 lg:pb-0 flex-1">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <Footer />
      </div>
    </div>
  );
}
