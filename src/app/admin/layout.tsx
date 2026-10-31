import type { Viewport } from "next";
import { Bebas_Neue, Geist } from "next/font/google";
import { ADMIN_THEME_INIT_SCRIPT } from "@/components/admin-theme-shared";
import { AdminThemeScope } from "@/components/admin-theme-scope";
import "./admin.css";

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

// Next renders no browser-bar color on admin routes: the theme script and AdminThemeScope own that
// tag so it follows the light or dark theme and never lingers on public pages.
export const viewport: Viewport = {
  themeColor: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`admin-app ${geistSans.variable} ${bebasNeue.variable}`}>
      {/* Sets the theme before first paint so the page never flashes the wrong one */}
      <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
      <AdminThemeScope>{children}</AdminThemeScope>
    </div>
  );
}
