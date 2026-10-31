"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLogoutButton from "@/components/admin-logout-button";
import AdminThemeToggle from "@/components/admin-theme-toggle";

type TabId = "reservations" | "today" | "calendar" | "metrics" | "rewards" | "menu" | "security" | "hours";

const ICON = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    label: "Today",
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  {
    id: "reservations",
    label: "Reservations",
    icon: (
      <svg {...ICON}>
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg {...ICON}>
        <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    ),
  },
  { id: "metrics", label: "Metrics", icon: null },
  { id: "rewards", label: "Rewards", icon: null },
  { id: "menu", label: "Menu", icon: null },
  { id: "hours", label: "Hours", icon: null },
  { id: "security", label: "Settings", icon: null },
];

const PRIMARY_TABS = TABS.slice(0, 3);
const MORE_TABS = TABS.slice(3);
const TAB_IDS = TABS.map((tab) => tab.id);

/**
 * The admin navigation: a glass top bar with all tabs on desktop, and on phones a slim top bar plus a
 * bottom tab bar (Today, Reservations, Calendar, More) with a sheet for everything else.
 * Tabs keep the same addresses and behaviour as before: /admin?tab=… replaces the address, no extra history.
 */
export default function AdminShell() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: TabId = TAB_IDS.includes(requestedTab as TabId) ? (requestedTab as TabId) : "reservations";
  const activeLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? "Back office";
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet on any tap outside it and on Escape.
  useEffect(() => {
    if (!moreOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".admin-more-sheet, .admin-more-trigger")) {
        setMoreOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const tabHref = (id: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    return `${pathname}?${params.toString()}`;
  };

  const moreActive = MORE_TABS.some((tab) => tab.id === activeTab);

  return (
    <>
      <nav className="admin-shell admin-shell--top" aria-label="Back office">
        <div className="admin-shell-inner">
          <Link className="admin-shell-brand" href={tabHref("reservations")} replace scroll={false} aria-label="Back office home">
            <Image src="/mascot_logo.webp" alt="" width={40} height={40} priority />
          </Link>
          <span className="admin-shell-title">{activeLabel}</span>

          <ul className="admin-shell-tabs">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <Link
                  href={tabHref(tab.id)}
                  replace
                  scroll={false}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="admin-shell-actions">
            <AdminThemeToggle variant="compact" />
            <Link className="admin-shell-site-link" href="/">
              View site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </nav>

      <nav className="admin-shell admin-shell--bottom" aria-label="Sections">
        <ul>
          {PRIMARY_TABS.map((tab) => (
            <li key={tab.id}>
              <Link
                href={tabHref(tab.id)}
                replace
                scroll={false}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="admin-more-trigger"
              aria-expanded={moreOpen}
              aria-controls="admin-more-sheet"
              aria-current={moreActive ? "page" : undefined}
              onClick={() => setMoreOpen((open) => !open)}
            >
              <svg {...ICON}>
                <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
              </svg>
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <div id="admin-more-sheet" className={`admin-more-sheet${moreOpen ? " open" : ""}`}>
        <p className="admin-more-heading">More</p>
        <ul className="admin-more-tabs">
          {MORE_TABS.map((tab) => (
            <li key={tab.id}>
              <Link
                href={tabHref(tab.id)}
                replace
                scroll={false}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="admin-more-row">
          <span>Theme</span>
          <AdminThemeToggle variant="full" />
        </div>
        <div className="admin-more-row admin-more-row--links">
          <Link href="/menu">Menu</Link>
          <Link href="/reserve">Reserve</Link>
          <AdminLogoutButton showLabel />
        </div>
      </div>
    </>
  );
}
