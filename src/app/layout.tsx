import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Geist, Geist_Mono, Pacifico } from "next/font/google";
import ScrollToTop from "@/components/scroll-to-top";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

const appBaseUrl = getSiteBaseUrl();
const siteDescription =
  "Mexican restaurant in Lisbon (Alcântara): tacos, margaritas, homestyle Mexican food and reservations.";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:logo" content={`${appBaseUrl}/favicon.webp`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${pacifico.variable}`}
        suppressHydrationWarning
      >
        {children}
        <ScrollToTop />
        <SpeedInsights />
      </body>
    </html>
  );
}
