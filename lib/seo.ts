import type { Metadata } from "next";

export const siteName = "Clinic Desk by Platanist";
export const siteTitleSuffix = "Clinic Desk by Platanist";
export const siteDescription =
  "Open-source OPD management software for clinics with visit tracking, prescriptions, billing, staff access, and self-hosted deployment options.";
export const defaultOgImage = "/platanist_clinic_desk.png";

export function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteOrigin());
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  image = defaultOgImage,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [
        {
          url: absoluteUrl(image),
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}