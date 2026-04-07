import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/en", "/pt", "/en/menu", "/pt/menu", "/en/reserve", "/pt/reserve"],
      disallow: ["/admin"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
