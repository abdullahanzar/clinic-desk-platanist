import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme";
import {
  absoluteUrl,
  defaultOgImage,
  getSiteOrigin,
  siteDescription,
  siteName,
  siteTitleSuffix,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: siteName,
    template: `%s | ${siteTitleSuffix}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "clinic management software",
    "OPD management system",
    "doctor prescription software",
    "clinic billing software",
    "self-hosted clinic software",
    "open source clinic management",
  ],
  authors: [{ name: "Platanist" }],
  creator: "Platanist",
  publisher: "Platanist",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: absoluteUrl("/"),
    siteName,
    type: "website",
    images: [
      {
        url: absoluteUrl(defaultOgImage),
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [absoluteUrl(defaultOgImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? {
          "msvalidate.01": process.env.BING_SITE_VERIFICATION,
        }
      : undefined,
  },
  category: "healthcare",
  icons: {
    icon: "/platanist_clinic_desk_minimal.png",
    apple: "/platanist_clinic_desk_minimal.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
