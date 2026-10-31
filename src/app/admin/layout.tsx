import type { Viewport } from "next";
import { ADMIN_THEME_INIT_SCRIPT } from "@/components/admin-theme-shared";
import { AdminThemeScope } from "@/components/admin-theme-scope";
import DocumentShell from "@/components/document-shell";
import "./admin.css";

// Next renders no browser-bar color on admin routes: the theme script and AdminThemeScope own that
// tag so it follows the light or dark theme and never lingers on public pages.
export const viewport: Viewport = {
  themeColor: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocumentShell lang="en">
      <div className="admin-app">
        {/* Sets the theme before first paint so the page never flashes the wrong one */}
        <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }} />
        <AdminThemeScope>{children}</AdminThemeScope>
      </div>
    </DocumentShell>
  );
}
