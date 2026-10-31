import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import ScrollToTop from "@/components/scroll-to-top";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

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
  themeColor: "#0a2b36",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        <meta property="og:logo" content={`${appBaseUrl}/favicon-v2.ico`} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollToTop />
        <SpeedInsights />
      </body>
    </html>
  );
}
