import { formatGuests } from "@/components/admin-format";
import AdminStatusChip from "@/components/admin-status-chip";

type TodayReservation = {
  id: string;
  time: string;
  firstName: string;
  lastName: string;
  guests: string;
  notes?: string | null;
  phone: string;
  isRead?: boolean;
  status: "new" | "confirmed" | "cancelled" | "no_show";
};

type TodayTimeline<R extends TodayReservation> = {
  date: string;
  cards: { label: string; value: string }[];
  currentReservationIds: string[];
  timelineReservations: R[];
  closedReservations: R[];
  markerIndex: number;
};

type Props<R extends TodayReservation> = {
  timeline: TodayTimeline<R>;
  actionKey: string | null;
  formatDate: (isoDate: string) => string;
  whatsAppHref: (reservation: R) => string;
  onMarkRead: (id: string) => void;
  onChangeStatus: (id: string, status: "confirmed" | "cancelled" | "no_show") => void;
};

const statLabel = (cards: TodayTimeline<TodayReservation>["cards"], label: string) =>
  cards.find((card) => card.label === label)?.value ?? "0";

/**
 * The Today board: who is coming, in time order, with a "now" marker and the next arrival highlighted.
 * Presentation only: data and actions come from the admin component, nothing is fetched or changed here.
 */
export default function AdminToday<R extends TodayReservation>({
  timeline,
  actionKey,
  formatDate,
  whatsAppHref,
  onMarkRead,
  onChangeStatus,
}: Props<R>) {
  const { timelineReservations, closedReservations, markerIndex, currentReservationIds } = timeline;
  const busy = actionKey !== null;
  const nextReservation = timelineReservations[markerIndex];

  return (
    <section className="admin-today" aria-label="Today">
      <p className="admin-today-date admin-muted">{formatDate(timeline.date)} in Lisbon time</p>

      <dl className="admin-today-stats">
        <div>
          <dt>Bookings</dt>
          <dd>{timelineReservations.length}</dd>
        </div>
        <div>
          <dt>Covers</dt>
          <dd>{statLabel(timeline.cards, "Covers today")}</dd>
        </div>
        <div>
          <dt>Pending</dt>
          <dd>{statLabel(timeline.cards, "Pending")}</dd>
        </div>
      </dl>

      {nextReservation ? (
        <div className="admin-today-nextup">
          <p className="admin-muted">Next arrival</p>
          <p className="admin-today-nextup-line">
            <strong>{nextReservation.time}</strong>
            <span>
              {nextReservation.firstName} {nextReservation.lastName}
            </span>
            <span className="admin-today-nextup-guests">{formatGuests(nextReservation.guests)}</span>
          </p>
        </div>
      ) : null}

      {timelineReservations.length === 0 ? (
        <p className="admin-today-empty">No active reservations left for today.</p>
      ) : (
        <ol className="admin-today-list">
          {timelineReservations.map((reservation, index) => {
            const isNext = index === markerIndex;
            const isArriving = currentReservationIds.includes(reservation.id);
            return (
              <li key={reservation.id} className="admin-today-item">
                {markerIndex === index ? (
                  <div className="admin-today-now" role="separator" aria-label="Now">
                    <span>Now</span>
                  </div>
                ) : null}
                <div className={`admin-today-row${isNext ? " is-next" : ""}${isArriving ? " is-arriving" : ""}`}>
                  <p className="admin-today-time">{reservation.time}</p>
                  <article className="admin-today-card">
                    <header className="admin-today-card-head">
                      <div>
                        <h3>
                          {reservation.firstName} {reservation.lastName}
                        </h3>
                        <p className="admin-today-meta admin-muted">
                          <strong>{formatGuests(reservation.guests)}</strong>
                          {reservation.notes?.trim() ? ` · ${reservation.notes.trim()}` : ""}
                        </p>
                      </div>
                      <div className="admin-today-chips">
                        {isNext ? <AdminStatusChip status="next" /> : null}
                        {isArriving && !isNext ? <AdminStatusChip status="arriving" /> : null}
                        {!reservation.isRead ? <AdminStatusChip status="unread" /> : null}
                        <AdminStatusChip status={reservation.status} />
                      </div>
                    </header>

                    <div className="admin-today-actions">
                      <a
                        className="btn btn-secondary"
                        href={whatsAppHref(reservation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Message ${reservation.firstName} ${reservation.lastName} on WhatsApp`}
                      >
                        WhatsApp {reservation.phone}
                      </a>
                      {!reservation.isRead ? (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => onMarkRead(reservation.id)}
                        >
                          Read
                        </button>
                      ) : null}
                      {reservation.status !== "confirmed" ? (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => onChangeStatus(reservation.id, "confirmed")}
                        >
                          {actionKey === `reservation-${reservation.id}-confirmed` ? "Updating…" : "Confirm"}
                        </button>
                      ) : null}
                      {reservation.status !== "cancelled" ? (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => onChangeStatus(reservation.id, "cancelled")}
                        >
                          {actionKey === `reservation-${reservation.id}-cancelled` ? "Updating…" : "Cancel"}
                        </button>
                      ) : null}
                      {reservation.status !== "no_show" ? (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => onChangeStatus(reservation.id, "no_show")}
                        >
                          {actionKey === `reservation-${reservation.id}-no_show` ? "Updating…" : "No show"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                </div>
              </li>
            );
          })}
          {markerIndex === timelineReservations.length ? (
            <li className="admin-today-item">
              <div className="admin-today-now" role="separator" aria-label="Now">
                <span>Now</span>
              </div>
            </li>
          ) : null}
        </ol>
      )}

      <section className="admin-today-closed" aria-labelledby="admin-today-closed-title">
        <div className="admin-today-closed-head">
          <div>
            <h2 id="admin-today-closed-title">Closed today</h2>
            <p className="admin-muted">Cancelled and no-show reservations, kept out of the live timeline.</p>
          </div>
          <span className="admin-today-count">{closedReservations.length}</span>
        </div>

        {closedReservations.length === 0 ? (
          <p className="admin-muted">No cancelled or no-show reservations today.</p>
        ) : (
          <ul className="admin-today-closed-list">
            {closedReservations.map((reservation) => (
              <li key={reservation.id} className="admin-today-closed-row">
                <div>
                  <strong>
                    {reservation.time} · {reservation.firstName} {reservation.lastName}
                  </strong>
                  <p className="admin-muted">{formatGuests(reservation.guests)}</p>
                </div>
                <AdminStatusChip status={reservation.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
