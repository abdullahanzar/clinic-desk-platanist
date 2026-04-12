import { AppBackButton } from "@/components/layout/app-back-button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBackButton defaultFallbackHref="/" className="fixed left-4 top-4 z-40" />
      {children}
    </>
  );
}
