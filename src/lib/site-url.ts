/** Canonical site origin for metadata, sitemap, JSON-LD, and robots. */
export function getSiteBaseUrl(): string {
  const raw =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://www.tlaloc-restaurant.pt";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
