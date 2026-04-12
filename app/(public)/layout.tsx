import { Footer } from "@/components/layout/footer";
import { AppBackButton } from "@/components/layout/app-back-button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppBackButton defaultFallbackHref="/" className="fixed left-4 top-4 z-40" />
      <main className="flex-1">{children}</main>
      <Footer className="no-print" />
    </div>
  );
}
