import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register", "/legal/"],
      disallow: ["/api/", "/dashboard", "/admin", "/super-admin"],
    },
    sitemap: [absoluteUrl("/sitemap.xml").toString()],
    host: getSiteOrigin(),
  };
}