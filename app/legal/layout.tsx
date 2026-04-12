import { Footer } from "@/components/layout/footer";
import { AppBackButton } from "@/components/layout/app-back-button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AppBackButton defaultFallbackHref="/" className="fixed left-4 top-4 z-40" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
