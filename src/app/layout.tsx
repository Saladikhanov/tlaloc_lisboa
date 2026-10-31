import type { Metadata, Viewport } from "next";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./globals.css";

const appBaseUrl = getSiteBaseUrl();
const siteDescription =
  "Mexican restaurant in Lisbon (Alcântara): tacos, margaritas, homestyle Mexican food and reservations.";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon-v2.ico",
    shortcut: "/favicon-v2.ico",
    apple: "/apple-touch-icon-v2.png",
    other: [
      { rel: "icon", url: "/favicon-v2.webp", type: "image/webp" },
      { rel: "icon", url: "/favicon-v2.ico" },
      { rel: "icon", url: "/icon-192-v2.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", url: "/icon-512-v2.png", type: "image/png", sizes: "512x512" },
    ],
  },
  title: {
    default: "Mexican Restaurant in Lisbon | Tláloc",
    template: "%s | Tláloc",
  },
  description: siteDescription,
  openGraph: {
    title: "Tláloc Restaurant",
    description: siteDescription,
    type: "website",
    locale: "en_US",
    url: appBaseUrl,
    images: [
      {
        url: "/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "Tláloc Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tláloc Restaurant",
    description: siteDescription,
    images: ["/og_image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#c9e265",
  viewportFit: "cover",
};

// The <html> element is rendered by each route tree (locale, admin, root not-found) through
// DocumentShell, so the lang attribute is correct in the server-rendered HTML.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
