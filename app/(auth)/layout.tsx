import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Doctor sign-in and clinic signup flows for Clinic Desk by Platanist.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
