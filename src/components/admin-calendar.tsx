"use client";

import { useState } from "react";
import AdminDialog from "@/components/admin-dialog";
import AdminReservationCard, {
  type CardReservation,
  type ReservationReward,
  type ReservationStatus,
} from "@/components/admin-reservation-card";

export type CalendarCell = {
  day: number | null;
  count: number;
  hasClosure: boolean;
  isToday: boolean;
  label: string;
};

export type CalendarClosure = {
  id: string;
  startTime: string;
  endTime: string;
  note?: string;
};

type Props<R extends CardReservation> = {
  monthLabel: string;
  weekdays: string[];
  cells: CalendarCell[];
  selectedDay: number | null;
  selectedDate: string | null;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddReservation: () => void;
  actionKey: string | null;
  formatDate: (isoDate: string) => string;
  reservations: R[];
  languageLabel: (reservation: R) => string;
  phoneHref: (reservation: R) => string;
  emailHref: (reservation: R) => string;
  rewardFor: (reservation: R) => ReservationReward | null;
  onChangeStatus: (id: string, status: ReservationStatus) => void;
  closures: CalendarClosure[];
  closureForm: { startTime: string; endTime: string; note: string };
  onClosureFormChange: (
    patch: Partial<{ startTime: string; endTime: string; note: string }>,
  ) => void;
  isClosureToolsOpen: boolean;
  onClosureToolsOpenChange: (open: boolean) => void;
  onCreateClosure: () => void;
  onRemoveClosure: (id: string) => void;
};

const ICON = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/**
 * The Calendar tab: month grid, selected-day panel with closed windows and the day's confirmed guests.
 * Presentation only: every list and action is passed in from the admin component.
 */
export default function AdminCalendar<R extends CardReservation>({
  monthLabel,
  weekdays,
  cells,
  selectedDay,
  selectedDate,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onAddReservation,
  actionKey,
  formatDate,
  reservations,
  languageLabel,
  phoneHref,
  emailHref,
  rewardFor,
  onChangeStatus,
  closures,
  closureForm,
  onClosureFormChange,
  isClosureToolsOpen,
  onClosureToolsOpenChange,
  onCreateClosure,
  onRemoveClosure,
}: Props<R>) {
  const busy = actionKey !== null;
  const [pendingRemoval, setPendingRemoval] = useState<CalendarClosure | null>(
    null,
  );
  const closureError =
    closureForm.startTime &&
    closureForm.endTime &&
    closureForm.startTime >= closureForm.endTime
      ? "The end time must be after the start time."
      : null;

  return (
    <section className="admin-calendar" aria-label="Calendar">
      <header className="admin-calendar-head">
        <div className="admin-calendar-nav">
          <button
            className="admin-icon-btn"
            type="button"
            aria-label="Previous month"
            onClick={onPrevMonth}
          >
            <svg {...ICON}>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h2 className="admin-calendar-month" aria-live="polite">
            {monthLabel}
          </h2>
          <button
            className="admin-icon-btn"
            type="button"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <svg {...ICON}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          disabled={!selectedDate}
          onClick={onAddReservation}
        >
          {selectedDate
            ? `Add reservation · ${formatDate(selectedDate)}`
            : "Select a day to add a reservation"}
        </button>
      </header>

      <div className="admin-calendar-grid">
        {weekdays.map((weekday) => (
          <div key={weekday} className="admin-calendar-weekday">
            {weekday}
          </div>
        ))}
        {cells.map((cell, index) =>
          cell.day ? (
            <button
              key={`${cell.day}-${index}`}
              type="button"
              className={`admin-calendar-day${selectedDay === cell.day ? " is-selected" : ""}${cell.isToday ? " is-today" : ""}`}
              aria-pressed={selectedDay === cell.day}
              aria-label={`${cell.label}, ${cell.count} confirmed${cell.hasClosure ? ", has a closed window" : ""}${cell.isToday ? ", today" : ""}`}
              onClick={() => onSelectDay(cell.day as number)}
            >
              <span className="admin-calendar-day-number">{cell.day}</span>
              <span className="admin-calendar-day-marks">
                {cell.count > 0 ? (
                  <span className="admin-count">{cell.count}</span>
                ) : null}
                {cell.hasClosure ? (
                  <svg
                    className="admin-calendar-closed-mark"
                    {...ICON}
                    width={14}
                    height={14}
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M6.5 17.5l11-11" />
                  </svg>
                ) : null}
              </span>
            </button>
          ) : (
            <div
              key={`empty-${index}`}
              className="admin-calendar-empty"
              aria-hidden="true"
            />
          ),
        )}
      </div>
      <p className="admin-muted admin-calendar-legend">
        <span className="admin-count">3</span> confirmed guests that day ·{" "}
        <svg
          className="admin-calendar-closed-mark"
          {...ICON}
          width={14}
          height={14}
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M6.5 17.5l11-11" />
        </svg>{" "}
        closed window
      </p>

      <div className="admin-calendar-detail">
        {selectedDay === null || !selectedDate ? (
          <p className="admin-empty">
            Select a day to see its confirmed reservations.
          </p>
        ) : (
          <div className="admin-calendar-day-panel">
            <h3 className="admin-calendar-day-title">
              {formatDate(selectedDate)}
            </h3>

            <article className="admin-closures">
              <div className="admin-closures-head">
                <div>
                  <h4>Closed windows</h4>
                  <p className="admin-muted">
                    {closures.length > 0
                      ? `${closures.length} closed window${closures.length === 1 ? "" : "s"} on this day`
                      : "Guests can book all day."}
                  </p>
                </div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={isClosureToolsOpen}
                    onChange={(event) =>
                      onClosureToolsOpenChange(event.target.checked)
                    }
                  />
                  <span className="admin-switch-track" aria-hidden="true" />
                  <span>Manage</span>
                </label>
              </div>

              {isClosureToolsOpen ? (
                <div className="admin-closures-body">
                  <div className="admin-closure-fields">
                    <div className="admin-field">
                      <label htmlFor="closure-from">From</label>
                      <input
                        id="closure-from"
                        type="time"
                        value={closureForm.startTime}
                        aria-invalid={closureError ? true : undefined}
                        aria-describedby={
                          closureError ? "closure-error" : undefined
                        }
                        onChange={(event) =>
                          onClosureFormChange({ startTime: event.target.value })
                        }
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="closure-until">Until</label>
                      <input
                        id="closure-until"
                        type="time"
                        value={closureForm.endTime}
                        aria-invalid={closureError ? true : undefined}
                        aria-describedby={
                          closureError ? "closure-error" : undefined
                        }
                        onChange={(event) =>
                          onClosureFormChange({ endTime: event.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="closure-reason">Reason (optional)</label>
                    <input
                      id="closure-reason"
                      value={closureForm.note}
                      placeholder="Private event, fully booked…"
                      onChange={(event) =>
                        onClosureFormChange({ note: event.target.value })
                      }
                    />
                  </div>
                  {closureError ? (
                    <p
                      id="closure-error"
                      className="admin-form-error"
                      role="alert"
                    >
                      {closureError}
                    </p>
                  ) : null}
                  <div>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={busy || Boolean(closureError)}
                      onClick={onCreateClosure}
                    >
                      {actionKey === "create-calendar-closure"
                        ? "Saving…"
                        : "Close this window"}
                    </button>
                  </div>
                </div>
              ) : null}

              {closures.length > 0 ? (
                <ul className="admin-closure-list">
                  {closures.map((closure) => (
                    <li key={closure.id} className="admin-closure">
                      <div>
                        <strong>
                          {closure.startTime}–{closure.endTime}
                        </strong>
                        <p className="admin-muted">
                          {closure.note?.trim() ||
                            "Closed to new reservations in this window."}
                        </p>
                      </div>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingRemoval(closure)}
                      >
                        {actionKey === `delete-closure-${closure.id}`
                          ? "Removing…"
                          : "Remove"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>

            {reservations.length === 0 ? (
              <p className="admin-empty">
                No confirmed reservations on this day.
              </p>
            ) : (
              <ul className="admin-reservation-list">
                {reservations.map((reservation) => (
                  <li key={reservation.id}>
                    <AdminReservationCard
                      reservation={reservation}
                      actionKey={actionKey}
                      formatDate={formatDate}
                      languageLabel={languageLabel}
                      phoneHref={phoneHref}
                      emailHref={emailHref}
                      reward={rewardFor(reservation)}
                      onChangeStatus={onChangeStatus}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {pendingRemoval ? (
        <AdminDialog
          titleId="remove-closure-title"
          closeLabel="Close remove confirmation"
          onClose={() => setPendingRemoval(null)}
        >
          <h2 id="remove-closure-title">Remove closed window?</h2>
          <p>
            Guests will be able to book{" "}
            <strong>
              {pendingRemoval.startTime}–{pendingRemoval.endTime}
            </strong>{" "}
            on this day again.
          </p>
          <div className="admin-dialog-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setPendingRemoval(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              disabled={busy}
              onClick={() => {
                onRemoveClosure(pendingRemoval.id);
                setPendingRemoval(null);
              }}
            >
              Remove
            </button>
          </div>
        </AdminDialog>
      ) : null}
    </section>
  );
}
