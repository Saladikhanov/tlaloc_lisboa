"use client";

import { useAdminTheme } from "@/components/admin-theme-scope";
import type { AdminThemePreference } from "@/components/admin-theme-shared";

type Props = {
  /** "compact" shows icons only (top bar); "full" shows icons with text (sheet, login). */
  variant?: "compact" | "full";
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const OPTIONS: { value: AdminThemePreference; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Device",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];

/** Three-way theme choice: follow the device, or force light or dark. */
export default function AdminThemeToggle({ variant = "compact" }: Props) {
  const { preference, setPreference, ready } = useAdminTheme();
  // Before hydration finishes show "Device" so server and client markup match.
  const current = ready ? preference : "system";

  return (
    <div className={`admin-theme-toggle admin-theme-toggle--${variant}`} role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="admin-theme-option"
          aria-pressed={current === option.value}
          aria-label={variant === "compact" ? option.label : undefined}
          title={option.label}
          onClick={() => setPreference(option.value)}
        >
          {option.icon}
          {variant === "full" ? <span>{option.label}</span> : null}
        </button>
      ))}
    </div>
  );
}
