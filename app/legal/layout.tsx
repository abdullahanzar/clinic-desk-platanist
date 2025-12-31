import { Footer } from "@/components/layout/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
