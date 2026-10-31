import { formatGuests } from "@/components/admin-format";
import AdminStatusChip from "@/components/admin-status-chip";

export type ReservationStatus = "new" | "confirmed" | "cancelled" | "no_show";

export type CardReservation = {
  id: string;
  firstName: string;
  lastName: string;
  date: string;
  time: string;
  guests: string;
  phone: string;
  email: string;
  isRead?: boolean;
  status: ReservationStatus;
  version: string;
  occasion?: string | null;
  notes?: string | null;
};

export type ReservationReward = {
  code: string;
  status: string;
  label: string;
  whatsappHref: string;
  emailHref: string;
};

export const ALL_STATUS_OPTIONS: { value: ReservationStatus; label: string }[] =
  [
    { value: "new", label: "New" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no_show", label: "No show" },
  ];

const ICON = {
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

type Props<R extends CardReservation> = {
  reservation: R;
  isFresh?: boolean;
  actionKey: string | null;
  formatDate: (isoDate: string) => string;
  languageLabel: (reservation: R) => string;
  phoneHref: (reservation: R) => string;
  emailHref: (reservation: R) => string;
  reward: ReservationReward | null;
  statusOptions?: { value: ReservationStatus; label: string }[];
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string, guestName: string) => void;
  onChangeStatus: (id: string, status: ReservationStatus) => void;
};

/** One reservation card, shared by the Reservations inbox and the Calendar day panel. */
export default function AdminReservationCard<R extends CardReservation>({
  reservation,
  isFresh = false,
  actionKey,
  formatDate,
  languageLabel,
  phoneHref,
  emailHref,
  reward,
  statusOptions = ALL_STATUS_OPTIONS,
  onMarkRead,
  onDelete,
  onChangeStatus,
}: Props<R>) {
  const busy = actionKey !== null;
  const guestName = `${reservation.firstName} ${reservation.lastName}`;
  const hasDetails = Boolean(
    reservation.occasion?.trim() || reservation.notes?.trim(),
  );

  return (
    <article
      className={`admin-reservation${isFresh ? " is-fresh" : ""}${!reservation.isRead ? " is-unread" : ""}`}
      id={`reservation-card-${reservation.id}`}
    >
      <header className="admin-reservation-head">
        <div className="admin-reservation-chips">
          {!reservation.isRead ? <AdminStatusChip status="unread" /> : null}
          <AdminStatusChip status={reservation.status} />
        </div>
        {onMarkRead || onDelete ? (
          <div className="admin-reservation-icons">
            <button
              className="admin-icon-btn"
              type="button"
              id={`reservation-read-btn-${reservation.id}`}
              aria-label={`${reservation.isRead ? "Already read" : "Mark as read"} for ${guestName}`}
              title={reservation.isRead ? "Already read" : "Mark as read"}
              onClick={() => onMarkRead?.(reservation.id)}
              disabled={busy || Boolean(reservation.isRead)}
            >
              <svg {...ICON}>
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </button>
            <button
              className="admin-icon-btn admin-icon-btn--danger"
              type="button"
              id={`reservation-delete-btn-${reservation.id}`}
              aria-label={`Remove reservation for ${guestName}`}
              title="Remove reservation"
              onClick={() => onDelete?.(reservation.id, guestName)}
              disabled={busy}
            >
              <svg {...ICON}>
                <path d="M3 6h18M9 6V4h6v2M8 10v7M12 10v7M16 10v7M6 6l1 14h10l1-14" />
              </svg>
            </button>
          </div>
        ) : null}
      </header>

      <h3 className="admin-reservation-name">{guestName}</h3>
      <p className="admin-reservation-when">
        <strong>{formatDate(reservation.date)}</strong> at{" "}
        <strong>{reservation.time}</strong>
        <span className="admin-reservation-guests">
          {formatGuests(reservation.guests)}
        </span>
      </p>

      <div className="admin-reservation-contact">
        <a
          className="btn btn-secondary"
          id={`reservation-phone-link-${reservation.id}`}
          href={phoneHref(reservation)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp {reservation.phone}
        </a>
        {reservation.email ? (
          <a
            className="btn btn-secondary"
            id={`reservation-email-link-${reservation.id}`}
            href={emailHref(reservation)}
          >
            {reservation.email}
          </a>
        ) : null}
      </div>

      {reward ? (
        <div className="admin-reservation-reward">
          <div className="admin-reservation-reward-head">
            <strong>Guest reward</strong>
            <span className="admin-count">{reward.status}</span>
          </div>
          <p>
            <strong>{reward.code}</strong> · {reward.label}
          </p>
          <div className="admin-reservation-contact">
            <a
              className="btn btn-secondary"
              href={reward.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send reward WhatsApp
            </a>
            <a className="btn btn-secondary" href={reward.emailHref}>
              Send reward email
            </a>
          </div>
        </div>
      ) : null}

      {hasDetails ? (
        <details className="admin-reservation-details">
          <summary>More details</summary>
          {reservation.version === "v1" ? (
            <>
              <p>
                <strong>Occasion:</strong>{" "}
                {reservation.occasion?.trim() ? reservation.occasion : "-"}
              </p>
              <p>
                <strong>Special requests:</strong>{" "}
                {reservation.notes?.trim() ? reservation.notes : "-"}
              </p>
            </>
          ) : (
            <p>
              <strong>Other information:</strong>{" "}
              {reservation.notes?.trim() ? reservation.notes : "-"}
            </p>
          )}
        </details>
      ) : null}

      <div
        id={`reservation-status-actions-${reservation.id}`}
        className="admin-status-group"
        role="group"
        aria-label={`Set status for ${guestName}`}
      >
        {statusOptions.map((option) => (
          <button
            key={option.value}
            className={`btn btn-secondary admin-status-btn${reservation.status === option.value ? " is-current" : ""}`}
            type="button"
            aria-pressed={reservation.status === option.value}
            disabled={busy}
            onClick={() => onChangeStatus(reservation.id, option.value)}
          >
            {actionKey === `reservation-${reservation.id}-${option.value}`
              ? "Updating…"
              : option.label}
          </button>
        ))}
      </div>

      <p className="admin-reservation-meta admin-muted">
        Reservation #{reservation.id.slice(0, 8)} · {languageLabel(reservation)}{" "}
        · {reservation.version}
      </p>
    </article>
  );
}
