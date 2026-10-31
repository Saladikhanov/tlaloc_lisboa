"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  ADMIN_THEME_COLORS,
  ADMIN_THEME_META_ATTRIBUTE,
  ADMIN_THEME_STORAGE_KEY,
  type AdminResolvedTheme,
  type AdminThemePreference,
} from "@/components/admin-theme-shared";

type AdminThemeContextValue = {
  /** What the staff member chose: light, dark, or "system" (follow the device). */
  preference: AdminThemePreference;
  /** The theme actually applied right now. */
  resolved: AdminResolvedTheme;
  setPreference: (next: AdminThemePreference) => void;
  /** False until hydration is done; use it to avoid server/client markup mismatches in controls. */
  ready: boolean;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

// --- stored preference as an external store (same-tab updates notify listeners; other tabs use the storage event)
const listeners = new Set<() => void>();
// Keeps the choice for this page session even when storage is unavailable.
let memoryPreference: AdminThemePreference | null = null;
const notify = () => listeners.forEach((listener) => listener());

const subscribePreference = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

const getPreferenceSnapshot = (): AdminThemePreference => {
  if (memoryPreference !== null) {
    return memoryPreference;
  }
  try {
    const value = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};

// --- device color scheme as an external store
const DARK_QUERY = "(prefers-color-scheme: dark)";

const subscribeSystem = (onChange: () => void) => {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getSystemDarkSnapshot = () => window.matchMedia(DARK_QUERY).matches;

const subscribeNothing = () => () => {};

/**
 * Keeps the data-admin-theme attribute and the browser bar color in sync with the staff member's choice,
 * and removes both again when leaving the admin so the public site is never affected.
 */
export function AdminThemeScope({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore<AdminThemePreference>(
    subscribePreference,
    getPreferenceSnapshot,
    () => "system",
  );
  const systemDark = useSyncExternalStore(subscribeSystem, getSystemDarkSnapshot, () => false);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const resolved: AdminResolvedTheme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  // Apply the theme to <html> and to the admin's own browser-bar color tag.
  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", resolved);
    let meta = document.querySelector<HTMLMetaElement>(`meta[${ADMIN_THEME_META_ATTRIBUTE}]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute(ADMIN_THEME_META_ATTRIBUTE, "");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", ADMIN_THEME_COLORS[resolved]);
  }, [resolved]);

  // Leaving the admin removes both, so public pages are never affected.
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-admin-theme");
      document.querySelector(`meta[${ADMIN_THEME_META_ATTRIBUTE}]`)?.remove();
    };
  }, []);

  const setPreference = useCallback((next: AdminThemePreference) => {
    memoryPreference = next;
    try {
      if (next === "system") {
        window.localStorage.removeItem(ADMIN_THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next);
      }
    } catch {
      // Storage unavailable: nothing is remembered, the device setting applies.
    }
    notify();
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, ready }),
    [preference, resolved, setPreference, ready],
  );

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme(): AdminThemeContextValue {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used inside AdminThemeScope");
  }
  return context;
}
