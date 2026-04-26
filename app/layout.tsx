import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme";
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
  title: "Clinic Desk by Platanist",
  description: "Modern clinic management system by Platanist",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function report(name, value) {
                  try {
                    if (window.clinicDeskDesktop && window.clinicDeskDesktop.reportRendererMetric) {
                      window.clinicDeskDesktop.reportRendererMetric({ name: name, value: value, href: location.href });
                    }
                  } catch (e) {}
                }

                try {
                  new PerformanceObserver(function(list) {
                    list.getEntries().forEach(function(entry) {
                      if (entry.name === 'first-contentful-paint') {
                        report('first-contentful-paint', entry.startTime);
                      }
                    });
                  }).observe({ type: 'paint', buffered: true });
                } catch (e) {}

                window.addEventListener('DOMContentLoaded', function() {
                  report('dom-content-loaded', performance.now());
                }, { once: true });

                window.addEventListener('load', function() {
                  report('window-load', performance.now());
                }, { once: true });
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
