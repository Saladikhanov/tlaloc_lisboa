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

export const metadata: Metadata = {
  metadataBase: new URL("https://tlaloccantina.pt"),
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
  },
  title: {
    default: "Tláloc Cantina | Mexican Restaurant in Lisbon",
    template: "%s | Tláloc Cantina",
  },
  description:
    "Official Tláloc Cantina website with QR menu, online reservations, and updates.",
  openGraph: {
    title: "Tláloc Cantina",
    description:
      "Mexican food in Alcântara, Lisbon. Explore the menu and book your table.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/op_image.webp",
        width: 1200,
        height: 630,
        alt: "Tláloc Cantina",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${pacifico.variable}`}
      >
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
