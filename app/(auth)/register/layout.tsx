import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Doctor Signup for New Clinics",
  description:
    "Create a new Clinic Desk workspace for your clinic, verify the doctor email address, and activate prescription, billing, and visit-management tools.",
  path: "/register",
  keywords: [
    "clinic software signup",
    "doctor account registration",
    "clinic management onboarding",
    "new clinic workspace",
    "self-hosted clinic setup",
  ],
});

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}