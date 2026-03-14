import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/en", "/pt", "/en/menu", "/pt/menu", "/en/reserve", "/pt/reserve"],
      disallow: ["/admin"],
    },
    sitemap: "https://tlaloccantina.pt/sitemap.xml",
  };
}
