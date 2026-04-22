import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Clinic Login for Doctors and Staff",
  description:
    "Sign in to Clinic Desk to manage OPD visits, digital prescriptions, billing, receipts, and clinic staff workflows.",
  path: "/login",
  keywords: [
    "clinic login",
    "doctor dashboard login",
    "OPD software login",
    "clinic staff portal",
    "prescription software sign in",
  ],
});

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}