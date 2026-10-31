// Shared by the admin layout (server) and AdminThemeScope (client): no "use client" here so both can import it.

export const ADMIN_THEME_STORAGE_KEY = "tlaloc-admin-theme";

export type AdminThemePreference = "light" | "dark" | "system";
export type AdminResolvedTheme = "light" | "dark";

// Matches --a-bg in admin.css; used for the browser bar color.
export const ADMIN_THEME_COLORS: Record<AdminResolvedTheme, string> = {
  light: "#f4f6f5",
  dark: "#0b1417",
};

export const ADMIN_THEME_META_ATTRIBUTE = "data-admin-theme-color";

/**
 * Runs before first paint (inlined in the admin layout) so the page never flashes the wrong theme.
 * It also creates the admin's own browser-bar color tag (Next renders none on admin routes, see the admin
 * layout), so the tag is never shared with Next's own. Keep the logic identical to AdminThemeScope.
 */
export const ADMIN_THEME_INIT_SCRIPT = `(function(){try{var v=null;try{v=localStorage.getItem(${JSON.stringify(
  ADMIN_THEME_STORAGE_KEY,
)});}catch(e){}var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=(v==="light"||v==="dark")?v:(d?"dark":"light");document.documentElement.setAttribute("data-admin-theme",t);var m=document.querySelector("meta[${ADMIN_THEME_META_ATTRIBUTE}]");if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");m.setAttribute("${ADMIN_THEME_META_ATTRIBUTE}","");document.head.appendChild(m);}m.setAttribute("content",t==="dark"?${JSON.stringify(
  ADMIN_THEME_COLORS.dark,
)}:${JSON.stringify(ADMIN_THEME_COLORS.light)});}catch(e){}})();`;
