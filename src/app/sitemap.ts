import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tlaloccantina.pt";
  const locales = ["en", "pt"] as const;

  return [
    ...locales.map((locale) => ({
      url: `${base}/${locale}`,
      changeFrequency: "weekly" as const,
      priority: 1,
    })),
    ...locales.map((locale) => ({
      url: `${base}/${locale}/menu`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...locales.map((locale) => ({
      url: `${base}/${locale}/reserve`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
