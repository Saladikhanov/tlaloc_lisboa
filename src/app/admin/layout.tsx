import { Bebas_Neue, Geist } from "next/font/google";

// The back office keeps its original look (see ADMIN THEME in globals.css), including the
// legacy fonts, which are loaded only for admin routes.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`admin-theme ${geistSans.variable} ${bebasNeue.variable}`}>{children}</div>
  );
}
