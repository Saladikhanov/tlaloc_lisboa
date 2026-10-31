export type AdminChipStatus = "new" | "unread" | "confirmed" | "cancelled" | "no_show" | "next" | "arriving";

const LABELS: Record<AdminChipStatus, string> = {
  new: "New",
  unread: "Unread",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  no_show: "No-show",
  next: "Next",
  arriving: "Arriving now",
};

// Every chip carries text and a shape, so status is never shown by color alone.
function Shape({ status }: { status: AdminChipStatus }) {
  const common = {
    viewBox: "0 0 12 12",
    width: 12,
    height: 12,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (status === "confirmed") {
    return (
      <svg {...common}>
        <path d="M2 6.5l2.5 2.5L10 3.5" />
      </svg>
    );
  }
  if (status === "cancelled") {
    return (
      <svg {...common}>
        <path d="M3 3l6 6M9 3l-6 6" />
      </svg>
    );
  }
  if (status === "no_show") {
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="3.6" />
      </svg>
    );
  }
  if (status === "next" || status === "arriving") {
    return (
      <svg {...common}>
        <path d="M2.5 6h7M6.5 3l3 3-3 3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="6" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A small status label with a shape and text, themed by the admin tokens. */
export default function AdminStatusChip({ status }: { status: AdminChipStatus }) {
  return (
    <span className={`admin-chip admin-chip--${status}`}>
      <Shape status={status} />
      {LABELS[status]}
    </span>
  );
}
