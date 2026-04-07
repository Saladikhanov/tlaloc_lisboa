import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono, Pacifico } from "next/font/google";
import ScrollToTop from "@/components/scroll-to-top";
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

const appBaseUrlRaw =
  process.env.APP_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://tlaloc-lisboa-16i8.vercel.app");
const appBaseUrl = appBaseUrlRaw.startsWith("http")
  ? appBaseUrlRaw
  : `https://${appBaseUrlRaw}`;
const siteDescription =
  "An authentic Mexican corner in the heart of Alcântara, Lisboa — homestyle recipes, craft margaritas, and warm hospitality that keeps you coming back.";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
  },
  title: {
    default: "Tláloc Restaurant | Mexican Restaurant in Lisbon",
    template: "%s | Tláloc Restaurant",
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
        url: "/op_image.webp",
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
    images: ["/op_image.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${pacifico.variable}`}
        suppressHydrationWarning
      >
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
