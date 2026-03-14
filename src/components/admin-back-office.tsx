"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReservationRecord } from "@/lib/types";

type AdminMenuItem = {
  id: string;
  sectionId: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  price: string;
  vegetarian: boolean;
  order: number;
};

type AdminMenuSection = {
  id: string;
  slug: string;
  titleEn: string;
  titlePt: string;
  subtitleEn: string | null;
  subtitlePt: string | null;
  order: number;
  items: AdminMenuItem[];
};

type AdminWorkingHours = {
  id: string;
  weekday: number;
  isClosed: boolean;
  lunchOpen: string | null;
  lunchClose: string | null;
  dinnerOpen: string | null;
  dinnerClose: string | null;
};

type TabId = "reservations" | "menu" | "hours" | "security";
type DeleteReservationModalState = {
  id: string;
  guestName: string;
} | null;

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const mondayFirstOrder: number[] = [1, 2, 3, 4, 5, 6, 0];

const toWhatsAppUrl = (phone: string): string => {
  const raw = phone.trim();
  if (!raw) {
    return "#";
  }

  if (raw.startsWith("whatsapp:")) {
    return `https://wa.me/${raw.replace("whatsapp:", "").replace(/[^\d]/g, "")}`;
  }

  const digits = raw.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
};

export default function AdminBackOffice() {
  const [activeTab, setActiveTab] = useState<TabId>("reservations");
  const [isMenuEditMode, setIsMenuEditMode] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>([]);
  const [workingHours, setWorkingHours] = useState<AdminWorkingHours[]>([]);
  const [selectedBulkWeekdays, setSelectedBulkWeekdays] = useState<number[]>([1, 2, 3, 4]);
  const [bulkHours, setBulkHours] = useState({
    lunchOpen: "12:00",
    lunchClose: "15:00",
    dinnerOpen: "18:00",
    dinnerClose: "22:00",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [deleteReservationModal, setDeleteReservationModal] =
    useState<DeleteReservationModalState>(null);

  const [newSection, setNewSection] = useState({
    slug: "",
    titleEn: "",
    titlePt: "",
    subtitleEn: "",
    subtitlePt: "",
  });

  const [newItem, setNewItem] = useState({
    sectionId: "",
    nameEn: "",
    namePt: "",
    descriptionEn: "",
    descriptionPt: "",
    price: "",
    vegetarian: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    username: "admin",
    currentPassword: "",
    nextPassword: "",
  });

  const sortedSections = useMemo(
    () => [...menuSections].sort((a, b) => a.order - b.order),
    [menuSections],
  );
  const workingHoursMondayFirst = useMemo(() => {
    return [...workingHours].sort(
      (a, b) => mondayFirstOrder.indexOf(a.weekday) - mondayFirstOrder.indexOf(b.weekday),
    );
  }, [workingHours]);

  const loadAll = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setStatusMessage("");
    try {
      const [reservationResponse, menuResponse, workingHoursResponse] = await Promise.all([
        fetch("/api/reservations", { cache: "no-store" }),
        fetch("/api/admin/menu", { cache: "no-store" }),
        fetch("/api/admin/working-hours", { cache: "no-store" }),
      ]);

      const reservationJson = (await reservationResponse.json()) as { data?: ReservationRecord[] };
      const menuJson = (await menuResponse.json()) as { data?: AdminMenuSection[] };
      const workingHoursJson = (await workingHoursResponse.json()) as {
        data?: AdminWorkingHours[];
      };

      setReservations(reservationJson.data ?? []);
      setMenuSections(menuJson.data ?? []);
      setWorkingHours(workingHoursJson.data ?? []);
      setNewItem((prev) =>
        prev.sectionId || !menuJson.data?.[0]?.id
          ? prev
          : { ...prev, sectionId: menuJson.data[0].id },
      );
    } catch {
      setStatusMessage("Could not load back office data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAll(true);
  }, [loadAll]);

  async function runAction(key: string, action: () => Promise<void>) {
    setActionKey(key);
    try {
      await action();
    } finally {
      setActionKey(null);
    }
  }

  async function changeReservationStatus(id: string, status: ReservationRecord["status"]) {
    await runAction(`reservation-${id}-${status}`, async () => {
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setStatusMessage("Could not update reservation status.");
        return;
      }

      await loadAll();
    });
  }

  async function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("create-section", async () => {
      const response = await fetch("/api/admin/menu/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSection),
      });

      if (!response.ok) {
        setStatusMessage("Could not create section.");
        return;
      }

      setNewSection({ slug: "", titleEn: "", titlePt: "", subtitleEn: "", subtitlePt: "" });
      await loadAll();
    });
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("create-item", async () => {
      const response = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        setStatusMessage("Could not create item.");
        return;
      }

      setNewItem((prev) => ({
        ...prev,
        nameEn: "",
        namePt: "",
        descriptionEn: "",
        descriptionPt: "",
        price: "",
        vegetarian: false,
      }));
      await loadAll();
    });
  }

  async function saveSection(section: AdminMenuSection) {
    await runAction(`save-section-${section.id}`, async () => {
      const response = await fetch(`/api/admin/menu/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });

      if (!response.ok) {
        setStatusMessage("Could not update section.");
        return;
      }
      await loadAll();
    });
  }

  async function deleteSection(id: string) {
    await runAction(`delete-section-${id}`, async () => {
      const response = await fetch(`/api/admin/menu/sections/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusMessage("Could not delete section.");
        return;
      }
      await loadAll();
    });
  }

  async function saveItem(item: AdminMenuItem) {
    await runAction(`save-item-${item.id}`, async () => {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        setStatusMessage("Could not update item.");
        return;
      }

      await loadAll();
    });
  }

  async function deleteItem(id: string) {
    await runAction(`delete-item-${id}`, async () => {
      const response = await fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusMessage("Could not delete item.");
        return;
      }
      await loadAll();
    });
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("update-password", async () => {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not update password.");
        return;
      }

      setPasswordForm((prev) => ({ ...prev, currentPassword: "", nextPassword: "" }));
      setStatusMessage("Password updated.");
    });
  }

  async function saveWorkingHoursConfiguration() {
    await runAction("save-working-hours", async () => {
      const response = await fetch("/api/admin/working-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: workingHours.map((row) => ({
            weekday: row.weekday,
            isClosed: row.isClosed,
            lunchOpen: row.lunchOpen,
            lunchClose: row.lunchClose,
            dinnerOpen: row.dinnerOpen,
            dinnerClose: row.dinnerClose,
          })),
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not save working hours.");
        return;
      }

      setStatusMessage("Working hours updated.");
      await loadAll();
    });
  }

  function toggleBulkDay(day: number) {
    setSelectedBulkWeekdays((prev) =>
      prev.includes(day) ? prev.filter((candidate) => candidate !== day) : [...prev, day],
    );
  }

  function applyBulkHoursToSelectedDays() {
    if (selectedBulkWeekdays.length === 0) {
      setStatusMessage("Select at least one day for bulk update.");
      return;
    }

    setWorkingHours((prev) =>
      prev.map((row) =>
        selectedBulkWeekdays.includes(row.weekday)
          ? {
              ...row,
              isClosed: false,
              lunchOpen: bulkHours.lunchOpen || null,
              lunchClose: bulkHours.lunchClose || null,
              dinnerOpen: bulkHours.dinnerOpen || null,
              dinnerClose: bulkHours.dinnerClose || null,
            }
          : row,
      ),
    );
    setStatusMessage("Bulk hours applied. Click Save working hours to persist.");
  }

  function markSelectedDaysClosed() {
    if (selectedBulkWeekdays.length === 0) {
      setStatusMessage("Select at least one day for bulk update.");
      return;
    }

    setWorkingHours((prev) =>
      prev.map((row) =>
        selectedBulkWeekdays.includes(row.weekday)
          ? {
              ...row,
              isClosed: true,
              lunchOpen: null,
              lunchClose: null,
              dinnerOpen: null,
              dinnerClose: null,
            }
          : row,
      ),
    );
    setStatusMessage("Selected days marked as closed. Click Save working hours to persist.");
  }

  async function confirmDeleteReservation() {
    if (!deleteReservationModal) {
      return;
    }

    const reservationId = deleteReservationModal.id;
    await runAction(`delete-reservation-${reservationId}`, async () => {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatusMessage("Could not delete reservation.");
        return;
      }

      setDeleteReservationModal(null);
      await loadAll();
    });
  }

  return (
    <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "reservations" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("reservations")}
          type="button"
        >
          Reservations
        </button>
        <button
          className={`btn ${activeTab === "menu" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("menu")}
          type="button"
        >
          Menu Configuration
        </button>
        <button
          className={`btn ${activeTab === "security" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("security")}
          type="button"
        >
          Security
        </button>
        <button
          className={`btn ${activeTab === "hours" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("hours")}
          type="button"
        >
          Working Hours
        </button>
      </div>

      {statusMessage ? <p className="footer-note">{statusMessage}</p> : null}
      {isLoading ? <p className="footer-note db-loader">Loading data...</p> : null}
      {isRefreshing ? <p className="footer-note db-loader">Syncing with database...</p> : null}

      {activeTab === "reservations" ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {isLoading || isRefreshing ? (
            <div className="reservation-list-loader" aria-live="polite" aria-busy="true">
              <article className="card reservation-skeleton-card">
                <div className="skeleton-line w-35" />
                <div className="skeleton-line w-75" />
                <div className="skeleton-line w-55" />
                <div className="skeleton-line w-65" />
              </article>
              <article className="card reservation-skeleton-card">
                <div className="skeleton-line w-40" />
                <div className="skeleton-line w-70" />
                <div className="skeleton-line w-60" />
                <div className="skeleton-line w-50" />
              </article>
            </div>
          ) : reservations.length === 0 ? (
            <div className="card">No reservations yet.</div>
          ) : (
            reservations.map((reservation) => (
              <article className="card" key={reservation.id}>
                <button
                  className="icon-btn danger-icon-btn reservation-delete-corner-btn"
                  type="button"
                  aria-label={`Delete reservation for ${reservation.firstName} ${reservation.lastName}`}
                  title="Delete reservation"
                  onClick={() =>
                    setDeleteReservationModal({
                      id: reservation.id,
                      guestName: `${reservation.firstName} ${reservation.lastName}`,
                    })
                  }
                  disabled={actionKey !== null}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M3 6h18M9 6V4h6v2M8 10v7M12 10v7M16 10v7M6 6l1 14h10l1-14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  Reservation #{reservation.id.slice(0, 8)}
                </p>
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
                <p>
                  {reservation.date} at {reservation.time} · Guests: {reservation.guests}
                </p>
                <p>
                  <a
                    href={toWhatsAppUrl(reservation.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reservation.phone}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${reservation.email}`}>{reservation.email}</a>
                </p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "new")}
                  >
                    {actionKey === `reservation-${reservation.id}-new` ? "Updating..." : "New"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "confirmed")}
                  >
                    {actionKey === `reservation-${reservation.id}-confirmed`
                      ? "Updating..."
                      : "Confirmed"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "cancelled")}
                  >
                    {actionKey === `reservation-${reservation.id}-cancelled`
                      ? "Updating..."
                      : "Cancelled"}
                  </button>
                  <span
                    className={`pill reservation-status reservation-status-${reservation.status}`}
                  >
                    {reservation.status}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "menu" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
              <h3>Menu Preview</h3>
              <button
                className={`btn ${isMenuEditMode ? "btn-primary" : "btn-secondary"}`}
                type="button"
                onClick={() => setIsMenuEditMode((prev) => !prev)}
              >
                {isMenuEditMode ? "Done editing" : "Edit menu"}
              </button>
            </div>
            <p className="footer-note" style={{ marginTop: "0.6rem" }}>
              {isMenuEditMode
                ? "Edit mode is active. Save each section/item after changes."
                : "Read-only mode. Click Edit menu to modify sections, items, prices and vegetarian flags."}
            </p>
          </section>

          {!isMenuEditMode ? (
            sortedSections.map((section) => (
              <section className="card" key={section.id}>
                <h3>{section.titleEn}</h3>
                <p className="footer-note" style={{ marginTop: "0.3rem" }}>
                  {section.titlePt}
                </p>
                {section.subtitleEn ? (
                  <p className="footer-note" style={{ marginTop: "0.3rem" }}>
                    {section.subtitleEn}
                  </p>
                ) : null}
                <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.55rem" }}>
                  {section.items.map((item) => (
                    <article key={item.id} className="card" style={{ padding: "0.7rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.7rem",
                          alignItems: "baseline",
                        }}
                      >
                        <strong>
                          {item.nameEn}
                          {item.vegetarian ? " 🌱" : ""}
                        </strong>
                        <span className="pill">{item.price}</span>
                      </div>
                      <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                        {item.descriptionEn}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : null}

          {isMenuEditMode ? (
            <>
              <section className="card">
            <h3 style={{ marginBottom: "0.7rem" }}>Add Section</h3>
            <form onSubmit={createSection} className="form-grid">
              <input
                placeholder="Slug (example: specials)"
                value={newSection.slug}
                onChange={(event) => setNewSection((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <input
                placeholder="Title EN"
                value={newSection.titleEn}
                onChange={(event) => setNewSection((prev) => ({ ...prev, titleEn: event.target.value }))}
                required
              />
              <input
                placeholder="Title PT"
                value={newSection.titlePt}
                onChange={(event) => setNewSection((prev) => ({ ...prev, titlePt: event.target.value }))}
                required
              />
              <input
                placeholder="Subtitle EN (optional)"
                value={newSection.subtitleEn}
                onChange={(event) =>
                  setNewSection((prev) => ({ ...prev, subtitleEn: event.target.value }))
                }
              />
              <input
                placeholder="Subtitle PT (optional)"
                value={newSection.subtitlePt}
                onChange={(event) =>
                  setNewSection((prev) => ({ ...prev, subtitlePt: event.target.value }))
                }
              />
              <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
                {actionKey === "create-section" ? "Saving..." : "Add section"}
              </button>
            </form>
              </section>

              <section className="card">
                <h3 style={{ marginBottom: "0.7rem" }}>Add Item</h3>
                <form onSubmit={createItem} className="form-grid">
              <select
                value={newItem.sectionId}
                onChange={(event) => setNewItem((prev) => ({ ...prev, sectionId: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select section
                </option>
                {sortedSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.titleEn}
                  </option>
                ))}
              </select>
              <input
                placeholder="Item name EN"
                value={newItem.nameEn}
                onChange={(event) => setNewItem((prev) => ({ ...prev, nameEn: event.target.value }))}
                required
              />
              <input
                placeholder="Item name PT"
                value={newItem.namePt}
                onChange={(event) => setNewItem((prev) => ({ ...prev, namePt: event.target.value }))}
                required
              />
              <input
                placeholder="Price"
                value={newItem.price}
                onChange={(event) => setNewItem((prev) => ({ ...prev, price: event.target.value }))}
                required
              />
              <input
                placeholder="Description EN"
                value={newItem.descriptionEn}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, descriptionEn: event.target.value }))
                }
                required
              />
              <input
                placeholder="Description PT"
                value={newItem.descriptionPt}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, descriptionPt: event.target.value }))
                }
                required
              />
              <label className="ios-switch-field">
                <input
                  className="ios-switch-input"
                  type="checkbox"
                  checked={newItem.vegetarian}
                  onChange={(event) =>
                    setNewItem((prev) => ({ ...prev, vegetarian: event.target.checked }))
                  }
                />
                <span className="ios-switch" aria-hidden="true" />
                <span>Vegetarian</span>
              </label>
                  <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
                    {actionKey === "create-item" ? "Saving..." : "Add item"}
                  </button>
                </form>
              </section>

              {sortedSections.map((section) => (
                <section className="card" key={section.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.7rem",
                      marginBottom: "0.7rem",
                    }}
                  >
                    <h3 style={{ marginBottom: 0 }}>Section: {section.titleEn}</h3>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() =>
                        setExpandedSectionId((prev) => (prev === section.id ? null : section.id))
                      }
                    >
                      {expandedSectionId === section.id ? "Collapse" : "Edit"}
                    </button>
                  </div>

                  {expandedSectionId !== section.id ? (
                    <p className="footer-note" style={{ marginTop: 0 }}>
                      Collapsed. Tap Edit to open this section.
                    </p>
                  ) : (
                    <>
                  <div className="form-grid" style={{ marginBottom: "0.7rem" }}>
                <input
                  value={section.slug}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, slug: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.titleEn}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, titleEn: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.titlePt}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, titlePt: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.subtitleEn ?? ""}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, subtitleEn: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.subtitlePt ?? ""}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, subtitlePt: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  value={section.order}
                  onWheel={(event) => (event.currentTarget as HTMLInputElement).blur()}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, order: Number(event.target.value) || 0 }
                          : candidate,
                      ),
                    )
                  }
                />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => saveSection(section)}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `save-section-${section.id}` ? "Saving..." : "Save section"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => deleteSection(section.id)}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `delete-section-${section.id}` ? "Deleting..." : "Delete section"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "0.8rem" }}>
                    {section.items.map((item) => (
                      <article key={item.id} style={{ borderTop: "1px solid var(--line)", paddingTop: "0.8rem" }}>
                        <div className="form-grid">
                      <input
                        value={item.nameEn}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, nameEn: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.namePt}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, namePt: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.price}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, price: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.descriptionEn}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, descriptionEn: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.descriptionPt}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, descriptionPt: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        type="number"
                        value={item.order}
                        onWheel={(event) => (event.currentTarget as HTMLInputElement).blur()}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, order: Number(event.target.value) || 0 }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <label className="ios-switch-field">
                        <input
                          className="ios-switch-input"
                          type="checkbox"
                          checked={item.vegetarian}
                          onChange={(event) =>
                            setMenuSections((prev) =>
                              prev.map((candidate) =>
                                candidate.id === section.id
                                  ? {
                                      ...candidate,
                                      items: candidate.items.map((itemCandidate) =>
                                        itemCandidate.id === item.id
                                          ? { ...itemCandidate, vegetarian: event.target.checked }
                                          : itemCandidate,
                                      ),
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                        <span className="ios-switch" aria-hidden="true" />
                        <span>Vegetarian</span>
                      </label>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => saveItem(item)}
                            disabled={actionKey !== null}
                          >
                            {actionKey === `save-item-${item.id}` ? "Saving..." : "Save item"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            disabled={actionKey !== null}
                          >
                            {actionKey === `delete-item-${item.id}` ? "Deleting..." : "Delete item"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                    </>
                  )}
                </section>
              ))}
            </>
          ) : null}
        </div>
      ) : null}

      {activeTab === "security" ? (
        <section className="card">
          <h3 style={{ marginBottom: "0.7rem" }}>Change Admin Password</h3>
          <form onSubmit={onPasswordSubmit} className="form-grid">
            <input
              placeholder="Username"
              value={passwordForm.username}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, username: event.target.value }))
              }
              required
            />
            <input
              placeholder="Current password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              required
            />
            <input
              placeholder="New password"
              type="password"
              minLength={6}
              value={passwordForm.nextPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, nextPassword: event.target.value }))
              }
              required
            />
            <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
              {actionKey === "update-password" ? "Updating..." : "Update password"}
            </button>
          </form>
          <p className="footer-note">Admin credentials are now stored in Prisma.</p>
        </section>
      ) : null}

      {activeTab === "hours" ? (
        <section className="card">
          <h3 style={{ marginBottom: "0.7rem" }}>Working Hours</h3>
          <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.9rem" }}>
            Week starts on Sunday. Reservations outside configured days/hours are automatically
            rejected.
          </p>
          <section className="card" style={{ padding: "0.8rem", marginBottom: "0.8rem" }}>
            <h4 style={{ marginBottom: "0.55rem" }}>Bulk update</h4>
            <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.6rem" }}>
              Select days, set shared hours, then apply.
            </p>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
              {mondayFirstOrder.map((day) => (
                <button
                  key={day}
                  className={`btn ${selectedBulkWeekdays.includes(day) ? "btn-primary" : "btn-secondary"}`}
                  type="button"
                  onClick={() => toggleBulkDay(day)}
                >
                  {weekdayLabels[day].slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="form-grid">
              <div>
                <label>Lunch start</label>
                <input
                  type="time"
                  value={bulkHours.lunchOpen}
                  onChange={(event) =>
                    setBulkHours((prev) => ({ ...prev, lunchOpen: event.target.value }))
                  }
                />
              </div>
              <div>
                <label>Lunch end</label>
                <input
                  type="time"
                  value={bulkHours.lunchClose}
                  onChange={(event) =>
                    setBulkHours((prev) => ({ ...prev, lunchClose: event.target.value }))
                  }
                />
              </div>
              <div>
                <label>Dinner start</label>
                <input
                  type="time"
                  value={bulkHours.dinnerOpen}
                  onChange={(event) =>
                    setBulkHours((prev) => ({ ...prev, dinnerOpen: event.target.value }))
                  }
                />
              </div>
              <div>
                <label>Dinner end</label>
                <input
                  type="time"
                  value={bulkHours.dinnerClose}
                  onChange={(event) =>
                    setBulkHours((prev) => ({ ...prev, dinnerClose: event.target.value }))
                  }
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
              <button className="btn btn-primary" type="button" onClick={applyBulkHoursToSelectedDays}>
                Apply hours to selected days
              </button>
              <button className="btn btn-secondary" type="button" onClick={markSelectedDaysClosed}>
                Mark selected days closed
              </button>
            </div>
          </section>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {workingHoursMondayFirst.map((row) => (
                <article key={row.id} className="card" style={{ padding: "0.75rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.8rem",
                      marginBottom: "0.65rem",
                    }}
                  >
                    <strong>{weekdayLabels[row.weekday] ?? `Day ${row.weekday}`}</strong>
                    <label className="ios-switch-field" style={{ marginBottom: 0 }}>
                      <input
                        className="ios-switch-input"
                        type="checkbox"
                        checked={row.isClosed}
                        onChange={(event) =>
                          setWorkingHours((prev) =>
                            prev.map((candidate) =>
                              candidate.weekday === row.weekday
                                ? { ...candidate, isClosed: event.target.checked }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <span className="ios-switch" aria-hidden="true" />
                      <span>{row.isClosed ? "Closed" : "Open"}</span>
                    </label>
                  </div>
                  <div className="form-grid">
                    <div>
                      <label>Lunch start</label>
                      <input
                        type="time"
                        value={row.lunchOpen ?? ""}
                        onChange={(event) =>
                          setWorkingHours((prev) =>
                            prev.map((candidate) =>
                              candidate.weekday === row.weekday
                                ? { ...candidate, lunchOpen: event.target.value || null }
                                : candidate,
                            ),
                          )
                        }
                        disabled={row.isClosed}
                      />
                    </div>
                    <div>
                      <label>Lunch end</label>
                      <input
                        type="time"
                        value={row.lunchClose ?? ""}
                        onChange={(event) =>
                          setWorkingHours((prev) =>
                            prev.map((candidate) =>
                              candidate.weekday === row.weekday
                                ? { ...candidate, lunchClose: event.target.value || null }
                                : candidate,
                            ),
                          )
                        }
                        disabled={row.isClosed}
                      />
                    </div>
                    <div>
                      <label>Dinner start</label>
                      <input
                        type="time"
                        value={row.dinnerOpen ?? ""}
                        onChange={(event) =>
                          setWorkingHours((prev) =>
                            prev.map((candidate) =>
                              candidate.weekday === row.weekday
                                ? { ...candidate, dinnerOpen: event.target.value || null }
                                : candidate,
                            ),
                          )
                        }
                        disabled={row.isClosed}
                      />
                    </div>
                    <div>
                      <label>Dinner end</label>
                      <input
                        type="time"
                        value={row.dinnerClose ?? ""}
                        onChange={(event) =>
                          setWorkingHours((prev) =>
                            prev.map((candidate) =>
                              candidate.weekday === row.weekday
                                ? { ...candidate, dinnerClose: event.target.value || null }
                                : candidate,
                            ),
                          )
                        }
                        disabled={row.isClosed}
                      />
                    </div>
                  </div>
                </article>
            ))}
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={saveWorkingHoursConfiguration}
              disabled={actionKey !== null}
            >
              {actionKey === "save-working-hours" ? "Saving..." : "Save working hours"}
            </button>
          </div>
        </section>
      ) : null}

      <AnimatePresence>
        {deleteReservationModal ? (
          <>
            <motion.button
              className="confirm-modal-backdrop"
              type="button"
              aria-label="Close delete confirmation"
              onClick={() => setDeleteReservationModal(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
            <div
              className="confirm-modal-wrap"
              onClick={() => setDeleteReservationModal(null)}
            >
              <motion.section
                className="confirm-modal-card"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <h3>Delete reservation?</h3>
                <p className="footer-note" style={{ marginTop: "0.6rem" }}>
                  This will permanently remove reservation for{" "}
                  <strong>{deleteReservationModal.guestName}</strong>.
                </p>
                <div className="confirm-modal-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setDeleteReservationModal(null)}
                    disabled={actionKey !== null}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={confirmDeleteReservation}
                    disabled={actionKey !== null}
                  >
                    {actionKey === `delete-reservation-${deleteReservationModal.id}`
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </motion.section>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
