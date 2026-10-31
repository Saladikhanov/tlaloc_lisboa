import AdminReservationCard, {
  type CardReservation as ListReservation,
  type ReservationReward,
  type ReservationStatus,
} from "@/components/admin-reservation-card";

export type { ReservationReward };

type Props<R extends ListReservation> = {
  reservations: R[];
  isLoading: boolean;
  showRead: boolean;
  onShowReadChange: (value: boolean) => void;
  highlightedIds: string[];
  actionKey: string | null;
  formatDate: (isoDate: string) => string;
  languageLabel: (reservation: R) => string;
  phoneHref: (reservation: R) => string;
  emailHref: (reservation: R) => string;
  rewardFor: (reservation: R) => ReservationReward | null;
  onMarkRead: (id: string) => void;
  onChangeStatus: (id: string, status: ReservationStatus) => void;
  onDelete: (id: string, guestName: string) => void;
};

/**
 * The Reservations inbox. Presentation only: data, the reward lookup and every action come from the admin
 * component, nothing is fetched or changed here.
 */
export default function AdminReservationList<R extends ListReservation>({
  reservations,
  isLoading,
  showRead,
  onShowReadChange,
  highlightedIds,
  actionKey,
  formatDate,
  languageLabel,
  phoneHref,
  emailHref,
  rewardFor,
  onMarkRead,
  onChangeStatus,
  onDelete,
}: Props<R>) {
  return (
    <section className="admin-reservations" aria-label="Reservations">
      <div className="admin-reservations-bar">
        <label className="admin-switch">
          <input
            type="checkbox"
            role="switch"
            checked={showRead}
            onChange={(event) => onShowReadChange(event.target.checked)}
          />
          <span className="admin-switch-track" aria-hidden="true" />
          <span>Show read reservations</span>
        </label>
      </div>

      {isLoading ? (
        <div
          className="admin-reservation-list"
          aria-live="polite"
          aria-busy="true"
        >
          {[0, 1].map((index) => (
            <div className="admin-skeleton-card" key={index}>
              <span className="admin-skeleton-line" style={{ width: "35%" }} />
              <span className="admin-skeleton-line" style={{ width: "75%" }} />
              <span className="admin-skeleton-line" style={{ width: "55%" }} />
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <p className="admin-empty">No reservations in inbox.</p>
      ) : (
        <ul className="admin-reservation-list">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <AdminReservationCard
                reservation={reservation}
                isFresh={highlightedIds.includes(reservation.id)}
                actionKey={actionKey}
                formatDate={formatDate}
                languageLabel={languageLabel}
                phoneHref={phoneHref}
                emailHref={emailHref}
                reward={rewardFor(reservation)}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
                onChangeStatus={onChangeStatus}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
