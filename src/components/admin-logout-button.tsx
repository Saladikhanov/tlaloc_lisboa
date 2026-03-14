"use client";

import { useRouter } from "next/navigation";

type AdminLogoutButtonProps = {
  showLabel?: boolean;
  className?: string;
};

export default function AdminLogoutButton({
  showLabel = false,
  className = "",
}: AdminLogoutButtonProps) {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/menu");
    router.refresh();
  }

  return (
    <button
      type="button"
      className={`btn btn-secondary ${showLabel ? "" : "btn-icon"} ${className}`.trim()}
      onClick={onLogout}
      aria-label="Exit admin"
      title="Exit admin"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M10 17L15 12L10 7M15 12H3M21 3V21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel ? <span style={{ marginLeft: "0.45rem" }}>Exit</span> : null}
    </button>
  );
}
