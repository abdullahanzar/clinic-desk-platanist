import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Code2,
  Download,
  ExternalLink,
  Github,
  Globe,
  Package,
  Scale,
  Shield,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { absoluteUrl, buildPageMetadata, siteName } from "@/lib/seo";
import { ThemeToggle } from "@/components/theme";

const homePageMetadata = buildPageMetadata({
  title: "Open-Source Clinic Management Software for Doctors",
  description:
    "Clinic Desk helps doctors and small clinics manage OPD visits, prescriptions, receipts, billing, staff access, and self-hosted deployments from one workflow.",
  path: "/",
  keywords: [
    "clinic management software",
    "OPD software for doctors",
    "prescription writing software",
    "clinic billing and receipts",
    "self-hosted medical software",
    "open source EMR alternative",
  ],
});

export const metadata: Metadata = {
  ...homePageMetadata,
  openGraph: {
    ...homePageMetadata.openGraph,
    locale: "en_US",
  },
};

const APP_VERSION = "0.1.0";
const DOWNLOAD_BASE_URL =
  "https://cdn.platanist.com/assets/clinic-desk-platanist";

const desktopDownloads = [
  {
    platform: "Windows",
    format: "NSIS installer",
    description: "Guided installer for most Windows clinic desktops.",
    filename: `Clinic Desk Setup ${APP_VERSION}.exe`,
  },
  {
    platform: "macOS",
    format: "DMG package",
    description: "Desktop package for macOS workstations and laptops.",
    filename: `Clinic-Desk-${APP_VERSION}.dmg`,
  },
  {
    platform: "Linux",
    format: "AppImage",
    description: "Portable Linux binary that runs without system install steps.",
    filename: `Clinic-Desk-${APP_VERSION}.AppImage`,
  },
  {
    platform: "Linux",
    format: "DEB package",
    description: "Native install package for Debian and Ubuntu based systems.",
    filename: `clinic-desk-by-platanist_${APP_VERSION}_amd64.deb`,
  },
] as const;

const sourceLinks = [
  {
    title: "Main repository",
    description:
      "Inspect the full Next.js clinic system, APIs, licensing, and deployment docs.",
    href: "https://github.com/abdullahanzar/clinic-desk-platanist",
    label: "Browse repository",
  },
  {
    title: "Electron desktop branch",
    description:
      "Review the desktop shell, Electron packaging, and release workflow on the electron-app branch.",
    href: "https://github.com/abdullahanzar/clinic-desk-platanist/tree/electron-app",
    label: "Inspect electron-app",
  },
  {
    title: "Open-source license",
    description:
      "Clinic Desk is distributed under AGPL-3.0, including hosted modifications.",
    href: "https://github.com/abdullahanzar/clinic-desk-platanist/blob/master/LICENSE",
    label: "Read AGPL-3.0",
  },
] as const;

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization").toString(),
      name: "Platanist",
      url: absoluteUrl("/").toString(),
      logo: absoluteUrl("/platanist_clinic_desk_minimal.png").toString(),
      sameAs: [
        "https://platanist.com",
        "https://github.com/abdullahanzar/clinic-desk-platanist",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl("/#software").toString(),
      name: siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Windows, macOS, Linux",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Open-source clinic management software for visits, prescriptions, billing, and staff workflows.",
      url: absoluteUrl("/").toString(),
      image: absoluteUrl("/platanist_clinic_desk.png").toString(),
      author: {
        "@id": absoluteUrl("/#organization").toString(),
      },
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website").toString(),
      name: siteName,
      url: absoluteUrl("/").toString(),
      description:
        "Clinic Desk by Platanist public site for hosted access, desktop downloads, licensing, and source review.",
      publisher: {
        "@id": absoluteUrl("/#organization").toString(),
      },
    },
  ],
};

function buildDownloadUrl(filename: string) {
  return `${DOWNLOAD_BASE_URL}/${encodeURIComponent(filename)}`;
}

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-linear-to-b from-brand-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData),
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-20 h-72 w-72 -translate-x-1/3 rounded-full bg-brand-200/70 blur-3xl dark:bg-brand-700/25" />
        <div className="absolute right-0 top-32 h-80 w-80 translate-x-1/4 rounded-full bg-accent-200/60 blur-3xl dark:bg-accent-500/15" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-300/60 to-transparent dark:via-brand-600/60" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 rounded-full border border-brand-100 bg-white/80 px-4 py-3 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-brand-300 via-brand-400 to-brand-600 shadow-md shadow-brand-900/15">
              <Image
                src="/platanist_clinic_desk_minimal.png"
                alt="Clinic Desk by Platanist"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                Clinic Desk by Platanist
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Web access, desktop binaries, and open-source transparency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 md:flex">
              <Link
                href="#downloads"
                className="rounded-full px-3 py-2 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Downloads
              </Link>
              <Link
                href="#source"
                className="rounded-full px-3 py-2 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Source
              </Link>
            </nav>
            <ThemeToggle variant="compact" />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 shadow-sm shadow-brand-950/5 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-200">
              <Shield className="h-4 w-4" />
              Practical clinic software with verifiable source and portable desktop builds
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              A cleaner front door for a clinic system that runs wherever your team needs it.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Launch the hosted workflow in the browser, download signed desktop packages for clinic workstations, or inspect the full codebase and license before deployment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 transition-transform hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Launch hosted system
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#downloads"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                Browse desktop releases
                <Download className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Hosted workflow
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Use the deployed Next.js app immediately with your existing browser.
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Native desktop builds
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Windows, macOS, AppImage, and Debian packages from one release stream.
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Open-source review
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Audit the repository, Electron branch, and AGPL obligations before rollout.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-4xl bg-linear-to-br from-brand-200/60 via-transparent to-accent-100/60 blur-2xl dark:from-brand-700/20 dark:to-accent-500/10" />
            <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/80 p-5 shadow-2xl shadow-brand-950/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="rounded-[1.75rem] bg-linear-to-br from-brand-500 via-brand-400 to-brand-700 p-6 text-white shadow-inner shadow-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/80">Current release</p>
                    <p className="mt-2 text-3xl font-semibold">v{APP_VERSION}</p>
                  </div>
                  <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    Stable build
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-brand-500/25">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-white/80">
                    <span>Clinic Desk shell</span>
                    <span>Browser + desktop</span>
                  </div>
                  <div className="flex items-center justify-center px-6 py-8">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 sm:h-20 sm:w-20">
                        <Image
                          src="/platanist_clinic_desk_minimal.png"
                          alt="Clinic Desk icon"
                          width={80}
                          height={80}
                          className="h-14 w-14 object-contain sm:h-18 sm:w-18"
                        />
                      </div>
                      <div className="flex items-baseline gap-2 sm:gap-3">
                        <span className="text-3xl font-semibold tracking-tight sm:text-4xl">
                          Clinic
                        </span>
                        <span className="bg-linear-to-r from-white via-brand-50 to-accent-50 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                          Desk
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/80 p-2 text-brand-700 shadow-sm dark:bg-slate-900/70 dark:text-brand-300">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Fastest start
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Browser login for clinics that want zero install friction.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-accent-100 bg-accent-50 p-4 dark:border-accent-900 dark:bg-accent-950/30">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/85 p-2 text-accent-600 shadow-sm dark:bg-slate-900/70 dark:text-accent-300">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Portable installs
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Desktop builds for reception desks, local operators, and labs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Run the deployed system
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Use the hosted workflow when you want immediate access, centralized updates, and no desktop installation overhead.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Open hosted workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-100 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
                <Download className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Install local binaries
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Download OS-specific packages for clinic desktops that need a packaged shell or offline-friendly operational setup.
              </p>
              <Link
                href="#downloads"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-600 transition-colors hover:text-accent-700 dark:text-accent-300 dark:hover:text-accent-200"
              >
                View all desktop assets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-brand-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Code2 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Inspect the source
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Review the application code, the Electron branch, and licensing details before self-hosting, extending, or approving usage.
              </p>
              <Link
                href="#source"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                Review transparency links
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="downloads" className="py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">
                Desktop releases
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                Download the package that matches each workstation.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Every asset points to the current release stream for Clinic Desk {APP_VERSION}. Choose the installer format that fits your deployment model.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {desktopDownloads.map((download) => (
              <article
                key={download.filename}
                className="group flex h-full flex-col rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-brand-950/5 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-950/10 dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {download.platform}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                    {download.format}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {download.description}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-3 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
                  {download.filename}
                </div>

                <Link
                  href={buildDownloadUrl(download.filename)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700 dark:bg-white dark:text-slate-900 dark:group-hover:bg-brand-100"
                >
                  Download binary
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="source" className="py-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-4xl border border-brand-100 bg-linear-to-br from-brand-50 via-white to-accent-50 p-7 shadow-sm shadow-brand-950/5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Github className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-slate-950 dark:text-white">
                Review the code and the obligations before you deploy.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Clinic Desk is not positioned as a black box. The repository, Electron packaging branch, and AGPL license are visible so procurement and engineering teams can validate exactly what they are adopting.
              </p>

              <div className="mt-7 space-y-4">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        Transparent architecture
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Inspect API routes, billing flows, prescription tooling, and deployment docs without guessing how the product behaves.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-accent-100 p-2 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        License clarity
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Review AGPL-3.0 obligations directly, including hosted modifications, before integrating or redistributing the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              {sourceLinks.map((link) => (
                <article
                  key={link.href}
                  className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-brand-950/5 backdrop-blur transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-950/10 dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                        {link.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                        {link.description}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {link.title === "Open-source license" ? (
                        <Scale className="h-5 w-5" />
                      ) : (
                        <Code2 className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {link.label}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-auto flex flex-col gap-4 border-t border-slate-200/80 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Clinic Desk by Platanist. Public entry point for hosted access, binary downloads, and source review.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Open app
            </Link>
            <Link href="/legal/license" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              License
            </Link>
            <Link href="/legal/disclaimer" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Disclaimer
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

