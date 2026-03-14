"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type AdminMessageTemplate = {
  id: string;
  key: "reservation_new" | "reservation_confirmed" | "reservation_cancelled";
  subjectEn: string;
  subjectPt: string;
  bodyEn: string;
  bodyPt: string;
};

type TabId = "reservations" | "calendar" | "menu" | "hours" | "security";
type DeleteReservationModalState = {
  id: string;
  guestName: string;
} | null;

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const mondayFirstOrder: number[] = [1, 2, 3, 4, 5, 6, 0];
const weekdayShortMondayFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getTodayMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseIsoDate = (
  isoDate: string,
): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const formatEuropeanDate = (isoDate: string): string => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month).padStart(2, "0")}/${parsed.year}`;
};

const compareReservationChronological = (
  a: ReservationRecord,
  b: ReservationRecord,
): number => {
  const aKey = `${a.date}T${a.time}`;
  const bKey = `${b.date}T${b.time}`;
  const bySlot = aKey.localeCompare(bKey);
  if (bySlot !== 0) {
    return bySlot;
  }

  return a.createdAt.localeCompare(b.createdAt);
};

const defaultMessageTemplates: Omit<AdminMessageTemplate, "id">[] = [
  {
    key: "reservation_new",
    subjectEn: "We received your reservation request",
    subjectPt: "Recebemos o seu pedido de reserva",
    bodyEn:
      "Hi {firstName},\nWe received your reservation request.\nDate: {date}\nTime: {time}\nGuests: {guests}\nWe will confirm shortly.\nTlaloc Cantina",
    bodyPt:
      "Ola {firstName},\nRecebemos o seu pedido de reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nVamos confirmar em breve.\nTlaloc Cantina",
  },
  {
    key: "reservation_confirmed",
    subjectEn: "Reservation confirmed - Tlaloc Cantina",
    subjectPt: "Reserva confirmada - Tlaloc Cantina",
    bodyEn:
      "Hi {firstName},\nYour reservation is confirmed.\nDate: {date}\nTime: {time}\nGuests: {guests}\nSee you soon!\nTlaloc Cantina",
    bodyPt:
      "Ola {firstName},\nA sua reserva foi confirmada.\nData: {date}\nHora: {time}\nPessoas: {guests}\nAte breve!\nTlaloc Cantina",
  },
  {
    key: "reservation_cancelled",
    subjectEn: "We could not confirm your reservation",
    subjectPt: "Nao conseguimos confirmar a reserva",
    bodyEn:
      "Hi {firstName},\nWe are sorry, but we could not confirm your reservation.\nDate: {date}\nTime: {time}\nGuests: {guests}\nPlease share another date/time and we will gladly assist.\nTlaloc Cantina",
    bodyPt:
      "Ola {firstName},\nPedimos desculpa, mas nao conseguimos confirmar a sua reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nSe quiser, envie-nos outra data/hora.\nTlaloc Cantina",
  },
];

const renderTemplate = (value: string, reservation: ReservationRecord): string => {
  const variables: Record<string, string> = {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    fullName: `${reservation.firstName} ${reservation.lastName}`.trim(),
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    phone: reservation.phone,
    email: reservation.email,
    occasion: reservation.occasion ?? "-",
    notes: reservation.notes ?? "-",
    status: reservation.status,
    locale: reservation.locale,
  };

  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, variableName: string) => {
    return variables[variableName] ?? "";
  });
};

const getTemplateByKey = (
  templates: AdminMessageTemplate[],
  key: AdminMessageTemplate["key"],
): AdminMessageTemplate => {
  const fromState = templates.find((template) => template.key === key);
  if (fromState) {
    return fromState;
  }

  const fallback = defaultMessageTemplates.find((template) => template.key === key)!;
  return { id: `default-${key}`, ...fallback };
};

const getContactTemplate = (
  reservation: ReservationRecord,
  templates: AdminMessageTemplate[],
): { subject: string; body: string } => {
  const isPortuguese = reservation.locale === "pt";
  const key: AdminMessageTemplate["key"] =
    reservation.status === "confirmed"
      ? "reservation_confirmed"
      : reservation.status === "cancelled"
        ? "reservation_cancelled"
        : "reservation_new";
  const template = getTemplateByKey(templates, key);

  return {
    subject: renderTemplate(isPortuguese ? template.subjectPt : template.subjectEn, reservation),
    body: renderTemplate(isPortuguese ? template.bodyPt : template.bodyEn, reservation),
  };
};

const toWhatsAppUrl = (
  phone: string,
  reservation: ReservationRecord,
  templates: AdminMessageTemplate[],
): string => {
  const raw = phone.trim();
  if (!raw) {
    return "#";
  }

  if (raw.startsWith("whatsapp:")) {
    return `https://wa.me/${raw.replace("whatsapp:", "").replace(/[^\d]/g, "")}`;
  }

  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return "#";
  }

  const { body } = getContactTemplate(reservation, templates);
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
};

const toEmailUrl = (
  email: string,
  reservation: ReservationRecord,
  templates: AdminMessageTemplate[],
): string => {
  const normalized = email.trim();
  if (!normalized) {
    return "mailto:";
  }

  const { subject, body } = getContactTemplate(reservation, templates);
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${normalized}?${params.toString()}`;
};

const getMessageLanguageLabel = (reservation: ReservationRecord): "EN" | "PT" =>
  reservation.locale === "pt" ? "PT" : "EN";

const hasReservationExtraDetails = (reservation: ReservationRecord): boolean =>
  Boolean(reservation.occasion?.trim() || reservation.notes?.trim());

export default function AdminBackOffice() {
  const [activeTab, setActiveTab] = useState<TabId>("reservations");
  const [isMenuEditMode, setIsMenuEditMode] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>([]);
  const [workingHours, setWorkingHours] = useState<AdminWorkingHours[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<AdminMessageTemplate[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(getTodayMonthKey);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
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
  const [showReadInPending, setShowReadInPending] = useState(false);
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
  const activeReservations = useMemo(
    () =>
      reservations
        .filter(
          (reservation) =>
            (showReadInPending ? true : reservation.isRead !== true),
        )
        .sort(compareReservationChronological),
    [reservations, showReadInPending],
  );
  const confirmedReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === "confirmed"),
    [reservations],
  );
  const calendarMonthDate = useMemo(() => {
    const match = /^(\d{4})-(\d{2})$/.exec(calendarMonth);
    if (!match) {
      return new Date();
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }, [calendarMonth]);
  const monthLabel = useMemo(
    () =>
      calendarMonthDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
    [calendarMonthDate],
  );
  const calendarCells = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const monthIndex = calendarMonthDate.getMonth();
    const firstDayWeekdayMondayIndex =
      (new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0)).getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12, 0, 0)).getUTCDate();

    const reservationsByDay = new Map<number, ReservationRecord[]>();
    for (const reservation of confirmedReservations) {
      const parsed = parseIsoDate(reservation.date);
      if (!parsed || parsed.year !== year || parsed.month !== monthIndex + 1) {
        continue;
      }
      const list = reservationsByDay.get(parsed.day) ?? [];
      list.push(reservation);
      reservationsByDay.set(parsed.day, list);
    }

    for (const [day, list] of reservationsByDay) {
      list.sort((a, b) => a.time.localeCompare(b.time));
      reservationsByDay.set(day, list);
    }

    const totalCells = Math.ceil((firstDayWeekdayMondayIndex + daysInMonth) / 7) * 7;
    const cells: Array<{ day: number | null; reservations: ReservationRecord[] }> = [];
    for (let index = 0; index < totalCells; index += 1) {
      const day = index - firstDayWeekdayMondayIndex + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push({ day: null, reservations: [] });
      } else {
        cells.push({ day, reservations: reservationsByDay.get(day) ?? [] });
      }
    }

    return cells;
  }, [calendarMonthDate, confirmedReservations]);
  const selectedDayReservations = useMemo(() => {
    if (selectedCalendarDay === null) {
      return [];
    }
    const found = calendarCells.find((cell) => cell.day === selectedCalendarDay);
    return found?.reservations ?? [];
  }, [calendarCells, selectedCalendarDay]);
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
      const [reservationResponse, menuResponse, workingHoursResponse, messageTemplatesResponse] =
        await Promise.all([
        fetch("/api/reservations", { cache: "no-store" }),
        fetch("/api/admin/menu", { cache: "no-store" }),
        fetch("/api/admin/working-hours", { cache: "no-store" }),
        fetch("/api/admin/message-templates", { cache: "no-store" }),
      ]);

      const reservationJson = (await reservationResponse.json()) as { data?: ReservationRecord[] };
      const menuJson = (await menuResponse.json()) as { data?: AdminMenuSection[] };
      const workingHoursJson = (await workingHoursResponse.json()) as {
        data?: AdminWorkingHours[];
      };
      const messageTemplatesJson = (await messageTemplatesResponse.json()) as {
        data?: AdminMessageTemplate[];
      };

      setReservations(reservationJson.data ?? []);
      setMenuSections(menuJson.data ?? []);
      setWorkingHours(workingHoursJson.data ?? []);
      setMessageTemplates(messageTemplatesJson.data ?? []);
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

  useEffect(() => {
    if (selectedCalendarDay === null) {
      return;
    }
    const exists = calendarCells.some((cell) => cell.day === selectedCalendarDay);
    if (!exists) {
      setSelectedCalendarDay(null);
    }
  }, [calendarCells, selectedCalendarDay]);

  async function runAction(key: string, action: () => Promise<void>) {
    setActionKey(key);
    try {
      await action();
    } finally {
      setActionKey(null);
    }
  }

  async function changeReservationStatus(id: string, status: ReservationRecord["status"]) {
    const current = reservations.find((reservation) => reservation.id === id);
    if (current?.status === status) {
      return;
    }

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

  async function saveMessageTemplatesConfiguration() {
    await runAction("save-message-templates", async () => {
      const response = await fetch("/api/admin/message-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: messageTemplates.map((template) => ({
            key: template.key,
            subjectEn: template.subjectEn,
            subjectPt: template.subjectPt,
            bodyEn: template.bodyEn,
            bodyPt: template.bodyPt,
          })),
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not save message templates.");
        return;
      }

      setStatusMessage("Message templates updated.");
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

  async function markReservationRead(id: string) {
    await runAction(`read-reservation-${id}`, async () => {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        setStatusMessage("Could not mark reservation as read.");
        return;
      }

      await loadAll();
    });
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
          className={`btn ${activeTab === "calendar" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("calendar")}
          type="button"
        >
          Confirmed Calendar
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
      {isRefreshing ? <div className="sync-overlay-badge">Syncing with database...</div> : null}

      {activeTab === "reservations" ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <label
            className="ios-switch-field"
            style={{ marginBottom: "0.2rem", alignSelf: "flex-start" }}
          >
            <input
              className="ios-switch-input"
              type="checkbox"
              checked={showReadInPending}
              onChange={(event) => setShowReadInPending(event.target.checked)}
            />
            <span className="ios-switch" aria-hidden="true" />
            <span>Show read reservations</span>
          </label>
          {isLoading ? (
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
          ) : activeReservations.length === 0 ? (
            <div className="card">No reservations in inbox.</div>
          ) : (
            activeReservations.map((reservation) => (
              <article className="card" key={reservation.id}>
                <div className="reservation-card-actions">
                  <button
                    className={`icon-btn reservation-delete-corner-btn ${reservation.isRead ? "read-icon-btn" : ""}`}
                    type="button"
                    aria-label={`${reservation.isRead ? "Already read" : "Mark as read"} for ${reservation.firstName} ${reservation.lastName}`}
                    title={reservation.isRead ? "Already read" : "Mark as read"}
                    onClick={() => markReservationRead(reservation.id)}
                    disabled={actionKey !== null || reservation.isRead}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M5 12.5l4.2 4.2L19 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
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
                </div>
                <div className="reservation-meta-row">
                  <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                    Reservation #{reservation.id.slice(0, 8)}
                  </p>
                  <span className="pill reservation-locale-chip">
                    {getMessageLanguageLabel(reservation)}
                  </span>
                </div>
                {reservation.isRead ? (
                  <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                    Read
                  </p>
                ) : null}
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
                <p>
                  {formatEuropeanDate(reservation.date)} at {reservation.time} · Guests:{" "}
                  {reservation.guests}
                </p>
                <p>
                  <a
                    href={toWhatsAppUrl(reservation.phone, reservation, messageTemplates)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reservation.phone}
                  </a>
                </p>
                <p>
                  <a href={toEmailUrl(reservation.email, reservation, messageTemplates)}>
                    {reservation.email}
                  </a>
                </p>
                {hasReservationExtraDetails(reservation) ? (
                  <details className="reservation-extra-details">
                    <summary>More details</summary>
                    <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                      <strong>Occasion:</strong> {reservation.occasion?.trim() ? reservation.occasion : "-"}
                    </p>
                    <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                      <strong>Special requests:</strong>{" "}
                      {reservation.notes?.trim() ? reservation.notes : "-"}
                    </p>
                  </details>
                ) : null}
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

      {activeTab === "calendar" ? (
        <section className="card">
          <div className="admin-calendar-head">
            <h3>Confirmed Reservations Calendar</h3>
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  const prev = new Date(
                    calendarMonthDate.getFullYear(),
                    calendarMonthDate.getMonth() - 1,
                    1,
                  );
                  setCalendarMonth(
                    `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
                  );
                  setSelectedCalendarDay(null);
                }}
              >
                Prev
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  const next = new Date(
                    calendarMonthDate.getFullYear(),
                    calendarMonthDate.getMonth() + 1,
                    1,
                  );
                  setCalendarMonth(
                    `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
                  );
                  setSelectedCalendarDay(null);
                }}
              >
                Next
              </button>
            </div>
          </div>
          <p className="footer-note" style={{ marginTop: "0.5rem" }}>
            {monthLabel}
          </p>
          <div className="admin-calendar-grid">
            {weekdayShortMondayFirst.map((weekday) => (
              <div key={weekday} className="admin-calendar-weekday">
                {weekday}
              </div>
            ))}
            {calendarCells.map((cell, index) =>
              cell.day ? (
                <button
                  key={`${cell.day}-${index}`}
                  type="button"
                  className={`admin-calendar-day ${selectedCalendarDay === cell.day ? "active" : ""}`}
                  onClick={() => setSelectedCalendarDay(cell.day)}
                >
                  <span>{cell.day}</span>
                  {cell.reservations.length > 0 ? (
                    <span className="admin-calendar-count">{cell.reservations.length}</span>
                  ) : null}
                </button>
              ) : (
                <div key={`empty-${index}`} className="admin-calendar-empty" />
              ),
            )}
          </div>

          <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.6rem" }}>
            {selectedCalendarDay === null ? (
              <p className="footer-note" style={{ marginTop: 0 }}>
                Select a day to view confirmed reservations.
              </p>
            ) : selectedDayReservations.length === 0 ? (
              <p className="footer-note" style={{ marginTop: 0 }}>
                No confirmed reservations for day {selectedCalendarDay}.
              </p>
            ) : (
              selectedDayReservations.map((reservation) => (
                <article className="card" key={`confirmed-${reservation.id}`}>
                  <div className="reservation-meta-row">
                    <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                      Reservation #{reservation.id.slice(0, 8)}
                    </p>
                    <span className="pill reservation-locale-chip">
                      {getMessageLanguageLabel(reservation)}
                    </span>
                  </div>
                  <strong>
                    {reservation.firstName} {reservation.lastName}
                  </strong>
                  <p>
                    {formatEuropeanDate(reservation.date)} at {reservation.time} · Guests:{" "}
                    {reservation.guests}
                  </p>
                  <p>
                    <a
                      href={toWhatsAppUrl(reservation.phone, reservation, messageTemplates)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {reservation.phone}
                    </a>
                  </p>
                  <p>
                    <a href={toEmailUrl(reservation.email, reservation, messageTemplates)}>
                      {reservation.email}
                    </a>
                  </p>
                  {hasReservationExtraDetails(reservation) ? (
                    <details className="reservation-extra-details">
                      <summary>More details</summary>
                      <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                        <strong>Occasion:</strong>{" "}
                        {reservation.occasion?.trim() ? reservation.occasion : "-"}
                      </p>
                      <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                        <strong>Special requests:</strong>{" "}
                        {reservation.notes?.trim() ? reservation.notes : "-"}
                      </p>
                    </details>
                  ) : null}
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
                      onClick={() => changeReservationStatus(reservation.id, "cancelled")}
                    >
                      {actionKey === `reservation-${reservation.id}-cancelled`
                        ? "Updating..."
                        : "Cancelled"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
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
        <div style={{ display: "grid", gap: "1rem" }}>
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

          <section className="card">
            <h3 style={{ marginBottom: "0.7rem" }}>Message Templates</h3>
            <p className="footer-note" style={{ marginTop: 0 }}>
              Message language is selected automatically from each reservation locale (EN/PT).
            </p>
            <p className="footer-note" style={{ marginTop: "0.35rem" }}>
              Variables you can use: {"{firstName}"}, {"{lastName}"}, {"{fullName}"}, {"{date}"},{" "}
              {"{time}"}, {"{guests}"}, {"{phone}"}, {"{email}"}, {"{occasion}"}, {"{notes}"}.
            </p>
            <div style={{ display: "grid", gap: "1rem", marginTop: "0.8rem" }}>
              {messageTemplates.map((template) => (
                <article
                  key={template.key}
                  style={{ borderTop: "1px solid var(--line)", paddingTop: "0.8rem" }}
                >
                  <h4 style={{ marginBottom: "0.55rem" }}>
                    {template.key === "reservation_new"
                      ? "Pending / Request Received"
                      : template.key === "reservation_confirmed"
                        ? "Confirmed"
                        : "Could Not Confirm (Apology)"}
                  </h4>
                  <div className="form-grid">
                    <input
                      placeholder="Subject EN"
                      value={template.subjectEn}
                      onChange={(event) =>
                        setMessageTemplates((prev) =>
                          prev.map((candidate) =>
                            candidate.key === template.key
                              ? { ...candidate, subjectEn: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Subject PT"
                      value={template.subjectPt}
                      onChange={(event) =>
                        setMessageTemplates((prev) =>
                          prev.map((candidate) =>
                            candidate.key === template.key
                              ? { ...candidate, subjectPt: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                    />
                    <textarea
                      placeholder="Body EN"
                      value={template.bodyEn}
                      onChange={(event) =>
                        setMessageTemplates((prev) =>
                          prev.map((candidate) =>
                            candidate.key === template.key
                              ? { ...candidate, bodyEn: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                    />
                    <textarea
                      placeholder="Body PT"
                      value={template.bodyPt}
                      onChange={(event) =>
                        setMessageTemplates((prev) =>
                          prev.map((candidate) =>
                            candidate.key === template.key
                              ? { ...candidate, bodyPt: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: "0.9rem" }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={saveMessageTemplatesConfiguration}
                disabled={actionKey !== null}
              >
                {actionKey === "save-message-templates" ? "Saving..." : "Save templates"}
              </button>
            </div>
          </section>
        </div>
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

      {deleteReservationModal ? (
        <>
          <button
            className="confirm-modal-backdrop"
            type="button"
            aria-label="Close delete confirmation"
            onClick={() => setDeleteReservationModal(null)}
          />
          <div className="confirm-modal-wrap" onClick={() => setDeleteReservationModal(null)}>
            <section
              className="confirm-modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
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
            </section>
          </div>
        </>
      ) : null}

    </div>
  );
}
