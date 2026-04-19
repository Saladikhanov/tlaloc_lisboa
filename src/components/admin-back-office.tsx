"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminEvent } from "@/lib/admin-events";
import type {
  ReservationLifecycleStatus,
  ReservationRecord,
  ReservationV2Record,
  RewardCodeRecord,
  RewardProgramSettingsRecord,
  RewardType,
} from "@/lib/types";

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

type AdminReservationClosure = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
};

type AdminReservationRecord = {
  id: string;
  version: "v1" | "v2";
  locale: "en" | "pt";
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  occasion?: string;
  notes?: string;
  isRead: boolean;
  status: ReservationLifecycleStatus;
  createdAt: string;
};

type AdminMessageTemplate = {
  id: string;
  key: "reservation_new" | "reservation_confirmed" | "reservation_cancelled";
  subjectEn: string;
  subjectPt: string;
  bodyEn: string;
  bodyPt: string;
};

type AdminTutorialSettings = {
  id: string;
  businessPhone: string;
  businessEmail: string;
};

type AdminRealtimeSettings = {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  notificationTheme: "green" | "orange" | "neutral";
};

type NativeNotificationPermission = NotificationPermission | "unsupported";

type AdminToast = {
  id: number;
  title: string;
  message: string;
  kind?: "default" | "reservation";
  theme?: AdminRealtimeSettings["notificationTheme"];
};

type AdminStatusToast = {
  id: number;
  message: string;
};

type AdminManualReservationForm = {
  locale: "en" | "pt";
  fullName: string;
  phone: string;
  email: string;
  time: string;
  guests: string;
  otherInfo: string;
};

const defaultRewardProgram: RewardProgramSettingsRecord = {
  id: "default",
  isEnabled: false,
  visitThreshold: 3,
  rewardType: "percent",
  rewardValue: "10",
  rewardLabel: "10% off",
  messageEn:
    "Thank you for coming back to Tlaloc Restaurant. Use code {code} for {rewardLabel} on your next visit.",
  messagePt:
    "Obrigado por voltar ao Tlaloc Restaurant. Use o codigo {code} para {rewardLabel} na sua proxima visita.",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

const defaultAdminRealtimeSettings: AdminRealtimeSettings = {
  soundEnabled: false,
  desktopEnabled: false,
  notificationTheme: "green",
};

const defaultManualReservationForm: AdminManualReservationForm = {
  locale: "pt",
  fullName: "",
  phone: "",
  email: "",
  time: "19:00",
  guests: "2",
  otherInfo: "",
};

const manualReservationLocaleOptions: Array<{ value: "en" | "pt"; label: string }> = [
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

const manualReservationGuestOptions = ["1", "2", "3", "4", "5", "6+"];

const manualReservationTimeOptions = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const adminNotificationThemeOptions: Array<{
  value: AdminRealtimeSettings["notificationTheme"];
  label: string;
}> = [
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "neutral", label: "Neutral" },
];

type TabId = "reservations" | "today" | "metrics" | "rewards" | "calendar" | "menu" | "hours" | "security";
type DeleteReservationModalState = {
  id: string;
  guestName: string;
} | null;

type AnchorHintPosition = {
  top: number;
  left: number;
};

type ReservationTutorialHintMode = "contact" | "status" | "clean";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const mondayFirstOrder: number[] = [1, 2, 3, 4, 5, 6, 0];
const weekdayShortMondayFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const adminTabIds: TabId[] = [
  "reservations",
  "today",
  "calendar",
  "metrics",
  "rewards",
  "menu",
  "security",
  "hours",
];

const getTabFromSearchParams = (searchParams: Pick<URLSearchParams, "get">): TabId | null => {
  const tab = searchParams.get("tab");
  return tab && adminTabIds.includes(tab as TabId) ? (tab as TabId) : null;
};

const getLisbonTodayIso = (): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

const addDaysToIsoDate = (isoDate: string, days: number): string => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  const next = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(
    next.getUTCDate(),
  ).padStart(2, "0")}`;
};

const toGuestCount = (guests: string): number => {
  const normalized = guests.trim();
  if (!normalized) {
    return 0;
  }

  if (normalized.endsWith("+")) {
    return Number(normalized.slice(0, -1)) || 0;
  }

  return Number(normalized) || 0;
};

const normalizePhoneKey = (phone: string): string | null => {
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? digits : null;
};

const normalizeEmailKey = (email: string): string | null => {
  const normalized = email.trim().toLowerCase();
  return normalized ? normalized : null;
};

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

const toAdminReservationRecord = (reservation: ReservationRecord): AdminReservationRecord => ({
  ...reservation,
  version: "v1",
});

const toAdminReservationV2Record = (
  reservation: ReservationV2Record,
): AdminReservationRecord => {
  const [firstName, ...rest] = reservation.fullName.trim().split(/\s+/);

  return {
    id: reservation.id,
    version: "v2",
    locale: reservation.locale,
    firstName: firstName || reservation.fullName,
    lastName: rest.join(" "),
    phone: reservation.phone,
    email: reservation.email ?? "",
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    occasion: undefined,
    notes: reservation.otherInfo ?? undefined,
    isRead: reservation.isRead,
    status: reservation.status,
    createdAt: reservation.createdAt,
  };
};

const compareReservationChronological = (
  a: AdminReservationRecord,
  b: AdminReservationRecord,
): number => {
  const aKey = `${a.date}T${a.time}`;
  const bKey = `${b.date}T${b.time}`;
  const bySlot = aKey.localeCompare(bKey);
  if (bySlot !== 0) {
    return bySlot;
  }

  return a.createdAt.localeCompare(b.createdAt);
};

const getManualReservationValidationError = (form: AdminManualReservationForm): string | null => {
  if (!form.fullName.trim()) {
    return "Full name is required.";
  }
  if (!form.phone.trim()) {
    return "Phone is required.";
  }
  if (!form.time.trim()) {
    return "Time is required.";
  }
  if (!form.guests.trim()) {
    return "Guests is required.";
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Email format is invalid.";
  }
  return null;
};

const toTimeMinutes = (time: string): number => {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 60 + Number(match[2]);
};

const getLisbonCurrentMinutes = (): number => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return Number(getPart("hour")) * 60 + Number(getPart("minute"));
};

const getLisbonCurrentTimeLabel = (): string => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(new Date());
};

const defaultMessageTemplates: Omit<AdminMessageTemplate, "id">[] = [
  {
    key: "reservation_new",
    subjectEn: "We received your reservation request",
    subjectPt: "Recebemos o seu pedido de reserva",
    bodyEn:
      "Hi {firstName},\nWe received your reservation request.\nDate: {date}\nTime: {time}\nGuests: {guests}\nWe will confirm shortly.\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nRecebemos o seu pedido de reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nVamos confirmar em breve.\nTlaloc Restaurant",
  },
  {
    key: "reservation_confirmed",
    subjectEn: "Reservation confirmed - Tlaloc Restaurant",
    subjectPt: "Reserva confirmada - Tlaloc Restaurant",
    bodyEn:
      "Hi {firstName},\nYour reservation is confirmed.\nDate: {date}\nTime: {time}\nGuests: {guests}\nSee you soon!\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nA sua reserva foi confirmada.\nData: {date}\nHora: {time}\nPessoas: {guests}\nAte breve!\nTlaloc Restaurant",
  },
  {
    key: "reservation_cancelled",
    subjectEn: "We could not confirm your reservation",
    subjectPt: "Nao conseguimos confirmar a reserva",
    bodyEn:
      "Hi {firstName},\nWe are sorry, but we could not confirm your reservation.\nDate: {date}\nTime: {time}\nGuests: {guests}\nPlease share another date/time and we will gladly assist.\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nPedimos desculpa, mas nao conseguimos confirmar a sua reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nSe quiser, envie-nos outra data/hora.\nTlaloc Restaurant",
  },
];

const renderTemplate = (value: string, reservation: AdminReservationRecord): string => {
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
  reservation: AdminReservationRecord,
  templates: AdminMessageTemplate[],
): { subject: string; body: string } => {
  const isPortuguese = reservation.locale === "pt";
  const key: AdminMessageTemplate["key"] =
    reservation.status === "confirmed"
      ? "reservation_confirmed"
      : reservation.status === "cancelled" || reservation.status === "no_show"
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
  reservation: AdminReservationRecord,
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
  reservation: AdminReservationRecord,
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

const getMessageLanguageLabel = (reservation: AdminReservationRecord): "EN" | "PT" =>
  reservation.locale === "pt" ? "PT" : "EN";

const normalizeRewardPhoneKey = (phone: string): string | undefined => {
  const digits = phone.replace(/[^\d]/g, "");
  return digits || undefined;
};

const normalizeRewardEmailKey = (email: string): string | undefined => {
  const normalized = email.trim().toLowerCase();
  return normalized || undefined;
};

const getActiveRewardCodeForReservation = (
  reservation: AdminReservationRecord,
  rewardCodes: RewardCodeRecord[],
): RewardCodeRecord | null => {
  const phoneKey = normalizeRewardPhoneKey(reservation.phone);
  const emailKey = normalizeRewardEmailKey(reservation.email);
  return (
    rewardCodes.find(
      (rewardCode) =>
        rewardCode.status === "active" &&
        ((phoneKey && rewardCode.phoneKey === phoneKey) || (emailKey && rewardCode.emailKey === emailKey)),
    ) ?? null
  );
};

const getRewardMessage = (
  rewardCode: RewardCodeRecord,
  locale: "en" | "pt",
): string => (locale === "pt" ? rewardCode.messagePt : rewardCode.messageEn) ?? rewardCode.rewardLabel;

const toRewardWhatsAppUrl = (
  phone: string,
  rewardCode: RewardCodeRecord,
  locale: "en" | "pt",
): string => {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) {
    return "#";
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(getRewardMessage(rewardCode, locale))}`;
};

const toRewardEmailUrl = (
  email: string,
  rewardCode: RewardCodeRecord,
  locale: "en" | "pt",
): string => {
  const normalized = email.trim();
  if (!normalized) {
    return "mailto:";
  }
  const params = new URLSearchParams({
    subject: locale === "pt" ? "Codigo promocional - Tlaloc Restaurant" : "Promo code - Tlaloc Restaurant",
    body: getRewardMessage(rewardCode, locale),
  });
  return `mailto:${normalized}?${params.toString()}`;
};

const hasReservationExtraDetails = (reservation: AdminReservationRecord): boolean =>
  Boolean(reservation.occasion?.trim() || reservation.notes?.trim());

function ReservationAnchorHints({
  reservationId,
  mode,
}: {
  reservationId: string;
  mode: ReservationTutorialHintMode;
}) {
  const [positions, setPositions] = useState<Record<string, AnchorHintPosition>>({});

  useEffect(() => {
    const cardId = `reservation-card-${reservationId}`;
    const readBtnId = `reservation-read-btn-${reservationId}`;
    const deleteBtnId = `reservation-delete-btn-${reservationId}`;
    const phoneId = `reservation-phone-link-${reservationId}`;
    const emailId = `reservation-email-link-${reservationId}`;
    const statusId = `reservation-status-actions-${reservationId}`;

    const update = () => {
      const card = document.getElementById(cardId);
      if (!card) {
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const next: Record<string, AnchorHintPosition> = {};

      const anchor = (
        key: string,
        targetId: string,
        mode:
          | "above-left"
          | "above-right"
          | "above-center"
          | "right-center"
          | "left-center"
          | "below-center"
          | "above-inline-left",
        offsetX: number,
        offsetY: number,
      ) => {
        const el = document.getElementById(targetId);
        if (!el) {
          return;
        }
        const rect = el.getBoundingClientRect();
        let left = rect.left - cardRect.left + offsetX;
        let top = rect.top - cardRect.top + offsetY;

        if (mode === "above-right") {
          left = rect.right - cardRect.left + offsetX;
          top = rect.top - cardRect.top + offsetY;
        }

        if (mode === "right-center") {
          left = rect.right - cardRect.left + offsetX;
          top = rect.top - cardRect.top + rect.height / 2 + offsetY;
        }

        if (mode === "left-center") {
          left = rect.left - cardRect.left + offsetX;
          top = rect.top - cardRect.top + rect.height / 2 + offsetY;
        }

        if (mode === "above-center") {
          left = rect.left - cardRect.left + rect.width / 2 + offsetX;
          top = rect.top - cardRect.top + offsetY;
        }

        if (mode === "below-center") {
          left = rect.left - cardRect.left + rect.width / 2 + offsetX;
          top = rect.bottom - cardRect.top + offsetY;
        }

        if (mode === "above-inline-left") {
          left = rect.left - cardRect.left + offsetX;
          top = rect.top - cardRect.top + offsetY;
        }

        next[key] = {
          left,
          top,
        };
      };

      anchor("read", readBtnId, "above-center", -2, -4);
      anchor("delete", deleteBtnId, "below-center", 0, 4);
      anchor("phone", phoneId, "right-center", 12, -1);
      anchor("email", emailId, "right-center", 12, -1);
      anchor("status", statusId, "right-center", 8, 0);
      setPositions(next);
    };

    update();
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [mode, reservationId]);

  const renderHint = (
    key: string,
    text: ReactNode,
    className: string,
  ) => {
    const point = positions[key];
    if (!point) {
      return null;
    }
    return (
      <span className={`reservation-anchor-hint ${className}`} style={{ left: point.left, top: point.top }}>
        {text}
      </span>
    );
  };

  return (
    <div className="reservation-anchor-layer" aria-hidden="true">
      {mode === "clean" ? renderHint("read", <>mark as read</>, "reservation-anchor-hint-read") : null}
      {mode === "contact" ? renderHint("phone", <>&larr; open WhatsApp</>, "reservation-anchor-hint-phone") : null}
      {mode === "contact" ? renderHint("email", <>&larr; open email app</>, "reservation-anchor-hint-email") : null}
      {mode === "status" ? renderHint("status", <>&larr; update status</>, "reservation-anchor-hint-status") : null}
    </div>
  );
}

export default function AdminBackOffice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => getTabFromSearchParams(searchParams) ?? "reservations");
  const navigateToTab = useCallback(
    (tab: TabId) => {
      setActiveTab((currentTab) => (currentTab === tab ? currentTab : tab));

      const currentTab = getTabFromSearchParams(searchParams) ?? "reservations";
      if (currentTab === tab) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set("tab", tab);
      router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const [isMenuEditMode, setIsMenuEditMode] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<AdminReservationRecord[]>([]);
  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>([]);
  const [workingHours, setWorkingHours] = useState<AdminWorkingHours[]>([]);
  const [reservationClosures, setReservationClosures] = useState<AdminReservationClosure[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<AdminMessageTemplate[]>([]);
  const [rewardProgram, setRewardProgram] = useState<RewardProgramSettingsRecord>(defaultRewardProgram);
  const [rewardCodes, setRewardCodes] = useState<RewardCodeRecord[]>([]);
  const [rewardLookupCode, setRewardLookupCode] = useState("");
  const [rewardLookupFeedback, setRewardLookupFeedback] = useState("");
  const [rewardLookupResult, setRewardLookupResult] = useState<RewardCodeRecord | null>(null);
  const [tutorialSettings, setTutorialSettings] = useState<AdminTutorialSettings>({
    id: "default",
    businessPhone: "+351 933 357 555",
    businessEmail: "reservas@tlaloc.local",
  });
  const [calendarMonth, setCalendarMonth] = useState(getTodayMonthKey);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [selectedBulkWeekdays, setSelectedBulkWeekdays] = useState<number[]>([1, 2, 3, 4]);
  const [bulkHours, setBulkHours] = useState({
    lunchOpen: "12:00",
    lunchClose: "15:00",
    dinnerOpen: "18:00",
    dinnerClose: "22:00",
  });
  const [isClosureToolsOpen, setIsClosureToolsOpen] = useState(false);
  const [isManualReservationFormOpen, setIsManualReservationFormOpen] = useState(false);
  const [manualReservationForm, setManualReservationForm] =
    useState<AdminManualReservationForm>(defaultManualReservationForm);
  const [closureForm, setClosureForm] = useState({
    startTime: "18:00",
    endTime: "20:00",
    note: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [isTutorialInProgress, setIsTutorialInProgress] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialDemoStatus, setTutorialDemoStatus] =
    useState<AdminReservationRecord["status"]>("new");
  const [tutorialDemoIsRead, setTutorialDemoIsRead] = useState(false);
  const [adminRealtimeSettings, setAdminRealtimeSettings] = useState<AdminRealtimeSettings>(
    defaultAdminRealtimeSettings,
  );
  const [nativeNotificationPermission, setNativeNotificationPermission] =
    useState<NativeNotificationPermission>("default");
  const [hasLoadedRealtimeSettings, setHasLoadedRealtimeSettings] = useState(false);
  const [adminToasts, setAdminToasts] = useState<AdminToast[]>([]);
  const [adminStatusToast, setAdminStatusToast] = useState<AdminStatusToast | null>(null);
  const [highlightedReservationIds, setHighlightedReservationIds] = useState<string[]>([]);
  const [showReadInPending, setShowReadInPending] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [deleteReservationModal, setDeleteReservationModal] =
    useState<DeleteReservationModalState>(null);
  const tutorialStepRefs = useRef<Array<HTMLElement | null>>([]);
  const toastTimeoutsRef = useRef<number[]>([]);
  const highlightTimeoutsRef = useRef<Record<string, number>>({});
  const toastIdRef = useRef(0);
  const statusToastTimeoutRef = useRef<number | null>(null);
  const statusToastIdRef = useRef(0);
  const hasShownRealtimeSelfTestRef = useRef(false);

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
  const manualReservationValidationError = useMemo(
    () => getManualReservationValidationError(manualReservationForm),
    [manualReservationForm],
  );
  const todayTimeline = useMemo(() => {
    const todayIso = getLisbonTodayIso();
    const currentMinutes = getLisbonCurrentMinutes();
    const currentTimeLabel = getLisbonCurrentTimeLabel();
    const todayReservations = reservations
      .filter((reservation) => reservation.date === todayIso)
      .sort(compareReservationChronological);
    const activeStatuses: AdminReservationRecord["status"][] = ["new", "confirmed"];
    const isActiveReservation = (reservation: AdminReservationRecord): boolean =>
      activeStatuses.includes(reservation.status);

    const happeningNow = todayReservations.filter((reservation) => {
      if (!isActiveReservation(reservation)) {
        return false;
      }
      const reservationMinutes = toTimeMinutes(reservation.time);
      return reservationMinutes >= currentMinutes - 45 && reservationMinutes <= currentMinutes + 30;
    });

    const nextUp = todayReservations.filter((reservation) => {
      if (!isActiveReservation(reservation)) {
        return false;
      }
      const reservationMinutes = toTimeMinutes(reservation.time);
      return reservationMinutes > currentMinutes + 30 && reservationMinutes <= currentMinutes + 120;
    });

    const laterToday = todayReservations.filter((reservation) => {
      if (!isActiveReservation(reservation)) {
        return false;
      }
      const reservationMinutes = toTimeMinutes(reservation.time);
      return reservationMinutes > currentMinutes + 120;
    });

    const timelineReservations = todayReservations.filter((reservation) => isActiveReservation(reservation));
    const closedReservations = todayReservations.filter((reservation) => !isActiveReservation(reservation));
    const currentMarkerIndex = timelineReservations.findIndex(
      (reservation) => toTimeMinutes(reservation.time) >= currentMinutes,
    );
    const effectiveMarkerIndex =
      currentMarkerIndex === -1 ? timelineReservations.length : currentMarkerIndex;

    const coversToday = todayReservations.reduce((sum, reservation) => sum + toGuestCount(reservation.guests), 0);
    const activeCount = timelineReservations.length;
    const pendingCount = todayReservations.filter((reservation) => reservation.status === "new").length;

    return {
      date: todayIso,
      currentTimeLabel,
      cards: [
        {
          label: "Today total",
          value: String(todayReservations.length),
          note: todayReservations.length === 1 ? "1 booking on the board" : `${todayReservations.length} bookings on the board`,
        },
        {
          label: "Live now",
          value: String(happeningNow.length + nextUp.length),
          note: `${happeningNow.length} now, ${nextUp.length} soon`,
        },
        {
          label: "Covers today",
          value: String(coversToday),
          note: `${activeCount} active reservations still in play`,
        },
        {
          label: "Pending",
          value: String(pendingCount),
          note: laterToday.length > 0 ? `${laterToday.length} later today` : "Nothing later today",
        },
      ],
      currentReservationIds: happeningNow.map((reservation) => reservation.id),
      timelineReservations,
      closedReservations,
      markerIndex: effectiveMarkerIndex,
    };
  }, [reservations]);
  const reservationMetrics = useMemo(() => {
    const todayIso = getLisbonTodayIso();
    const next30End = addDaysToIsoDate(todayIso, 29);
    const monthKey = todayIso.slice(0, 7);
    const pendingInbox = reservations.filter(
      (reservation) => reservation.status === "new" && reservation.isRead !== true,
    );
    const confirmedThisMonth = confirmedReservations.filter((reservation) =>
      reservation.date.startsWith(monthKey),
    );
    const busiestDayMap = new Map<string, { reservations: number; covers: number }>();

    for (const reservation of confirmedReservations) {
      if (reservation.date < todayIso || reservation.date > next30End) {
        continue;
      }

      const entry = busiestDayMap.get(reservation.date) ?? { reservations: 0, covers: 0 };
      entry.reservations += 1;
      entry.covers += toGuestCount(reservation.guests);
      busiestDayMap.set(reservation.date, entry);
    }

    const busiestDay = [...busiestDayMap.entries()].sort((a, b) => {
      if (b[1].covers !== a[1].covers) {
        return b[1].covers - a[1].covers;
      }
      if (b[1].reservations !== a[1].reservations) {
        return b[1].reservations - a[1].reservations;
      }
      return a[0].localeCompare(b[0]);
    })[0];

    return [
      {
        label: "Pending inbox",
        value: String(pendingInbox.length),
        note: pendingInbox.length === 1 ? "1 unread request to review" : `${pendingInbox.length} unread requests to review`,
      },
      {
        label: "This month",
        value: String(confirmedThisMonth.length),
        note: `${confirmedThisMonth.reduce((sum, reservation) => sum + toGuestCount(reservation.guests), 0)} covers confirmed`,
      },
      {
        label: "Busiest day",
        value: busiestDay ? `${busiestDay[1].covers}` : "-",
        note: busiestDay
          ? `${formatEuropeanDate(busiestDay[0])} · ${busiestDay[1].reservations} bookings`
          : "No confirmed demand in the next 30 days",
      },
    ];
  }, [confirmedReservations, reservations]);
  const reservationDashboard = useMemo(() => {
    const todayIso = getLisbonTodayIso();
    const next30End = addDaysToIsoDate(todayIso, 29);
    const upcomingConfirmed = confirmedReservations.filter(
      (reservation) => reservation.date >= todayIso && reservation.date <= next30End,
    );
    const statusBreakdown = [
      { label: "New", value: reservations.filter((reservation) => reservation.status === "new").length },
      {
        label: "Confirmed",
        value: reservations.filter((reservation) => reservation.status === "confirmed").length,
      },
      {
        label: "Cancelled",
        value: reservations.filter((reservation) => reservation.status === "cancelled").length,
      },
      {
        label: "No show",
        value: reservations.filter((reservation) => reservation.status === "no_show").length,
      },
    ];
    const guestAliasMap = new Map<string, string>();
    const guestsById = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        email: string;
        reservations: number;
        confirmed: number;
        upcomingConfirmed: number;
      }
    >();

    for (const reservation of reservations) {
      const phoneKey = normalizePhoneKey(reservation.phone);
      const emailKey = normalizeEmailKey(reservation.email);
      const matchedGuestId =
        (emailKey ? guestAliasMap.get(`email:${emailKey}`) : undefined) ??
        (phoneKey ? guestAliasMap.get(`phone:${phoneKey}`) : undefined);

      const guestId =
        matchedGuestId ?? emailKey ?? phoneKey ?? `guest:${reservation.id}`;
      const existingGuest = guestsById.get(guestId) ?? {
        id: guestId,
        name: `${reservation.firstName} ${reservation.lastName}`.trim(),
        phone: reservation.phone,
        email: reservation.email,
        reservations: 0,
        confirmed: 0,
        upcomingConfirmed: 0,
      };

      existingGuest.reservations += 1;
      if (reservation.status === "confirmed") {
        existingGuest.confirmed += 1;
      }
      if (
        reservation.status === "confirmed" &&
        reservation.date >= todayIso &&
        reservation.date <= next30End
      ) {
        existingGuest.upcomingConfirmed += 1;
      }
      if (!existingGuest.phone && reservation.phone) {
        existingGuest.phone = reservation.phone;
      }
      if (!existingGuest.email && reservation.email) {
        existingGuest.email = reservation.email;
      }
      guestsById.set(guestId, existingGuest);

      if (phoneKey) {
        guestAliasMap.set(`phone:${phoneKey}`, guestId);
      }
      if (emailKey) {
        guestAliasMap.set(`email:${emailKey}`, guestId);
      }
    }

    const guestList = [...guestsById.values()];
    const returningGuests = guestList.filter((guest) => guest.reservations >= 2);
    const topReturningGuests = [...returningGuests]
      .sort((a, b) => {
        if (b.reservations !== a.reservations) {
          return b.reservations - a.reservations;
        }
        if (b.confirmed !== a.confirmed) {
          return b.confirmed - a.confirmed;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6)
      .map((guest) => ({
        label: guest.name || guest.phone || guest.email || "Guest",
        value: guest.reservations,
        note:
          guest.email?.trim() ||
          guest.phone?.trim() ||
          `${guest.confirmed} confirmed bookings`,
      }));

    const weekdayDemandMap = new Map<number, { bookings: number; covers: number }>();
    for (const weekday of mondayFirstOrder) {
      weekdayDemandMap.set(weekday, { bookings: 0, covers: 0 });
    }
    for (const reservation of upcomingConfirmed) {
      const parsed = parseIsoDate(reservation.date);
      if (!parsed) {
        continue;
      }
      const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0)).getUTCDay();
      const current = weekdayDemandMap.get(weekday) ?? { bookings: 0, covers: 0 };
      current.bookings += 1;
      current.covers += toGuestCount(reservation.guests);
      weekdayDemandMap.set(weekday, current);
    }
    const weekdayDemand = mondayFirstOrder.map((weekday, index) => {
      const totals = weekdayDemandMap.get(weekday) ?? { bookings: 0, covers: 0 };
      return {
        label: weekdayShortMondayFirst[index],
        value: totals.covers,
        note: `${totals.bookings} bookings`,
      };
    });

    const timeSlotMap = new Map<string, { bookings: number; covers: number }>();
    for (const reservation of upcomingConfirmed) {
      const current = timeSlotMap.get(reservation.time) ?? { bookings: 0, covers: 0 };
      current.bookings += 1;
      current.covers += toGuestCount(reservation.guests);
      timeSlotMap.set(reservation.time, current);
    }
    const topTimeSlots = [...timeSlotMap.entries()]
      .sort((a, b) => {
        if (b[1].bookings !== a[1].bookings) {
          return b[1].bookings - a[1].bookings;
        }
        if (b[1].covers !== a[1].covers) {
          return b[1].covers - a[1].covers;
        }
        return a[0].localeCompare(b[0]);
      })
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value: value.bookings,
        note: `${value.covers} covers`,
      }));

    return {
      cards: [
        ...reservationMetrics,
        {
          label: "Guest reward",
          value: String(returningGuests.length),
          note:
            guestList.length > 0
              ? `${Math.round((returningGuests.length / guestList.length) * 100)}% of identified guests came more than once`
              : "No guest history yet",
        },
      ],
      statusBreakdown,
      topReturningGuests,
      weekdayDemand,
      topTimeSlots,
      hasUpcomingData: upcomingConfirmed.length > 0,
    };
  }, [confirmedReservations, reservationMetrics, reservations]);
  const isTutorialReservationMode = isTutorialInProgress && activeTab === "reservations";
  const isTutorialCalendarMode = isTutorialInProgress && activeTab === "calendar";
  const reservationTutorialHintMode: ReservationTutorialHintMode | null = useMemo(() => {
    if (!isTutorialInProgress || isTutorialMode || activeTab !== "reservations") {
      return null;
    }
    const hintStepIndex = Math.max(0, tutorialStepIndex - 1);

    if (hintStepIndex === 1) {
      return "contact";
    }

    if (hintStepIndex === 2) {
      return "status";
    }

    if (hintStepIndex === 3) {
      return "clean";
    }

    return null;
  }, [activeTab, isTutorialInProgress, isTutorialMode, tutorialStepIndex]);
  const tutorialDemoReservation = useMemo<AdminReservationRecord>(
    () => ({
      id: "tutorial-demo-reservation",
      version: "v1",
      locale: "en",
      firstName: "Alex",
      lastName: "Demo",
      phone: tutorialSettings.businessPhone,
      email: tutorialSettings.businessEmail,
      date: "2026-03-20",
      time: "20:00",
      guests: "2",
      occasion: "Birthday",
      notes: "Table by the window if possible.",
      status: tutorialDemoStatus,
      isRead: tutorialDemoIsRead,
      createdAt: "2026-03-14T12:00:00.000Z",
    }),
    [tutorialDemoIsRead, tutorialDemoStatus, tutorialSettings.businessEmail, tutorialSettings.businessPhone],
  );
  const reservationsToRender = useMemo(
    () => {
      if (!isTutorialReservationMode) {
        return activeReservations;
      }

      if (tutorialDemoReservation.isRead && !showReadInPending) {
        return [];
      }

      return [tutorialDemoReservation];
    },
    [activeReservations, isTutorialReservationMode, showReadInPending, tutorialDemoReservation],
  );
  const calendarMonthDate = useMemo(() => {
    const match = /^(\d{4})-(\d{2})$/.exec(calendarMonth);
    if (!match) {
      return new Date();
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }, [calendarMonth]);
  const tutorialCalendarReservation = useMemo<AdminReservationRecord>(() => {
    const year = calendarMonthDate.getFullYear();
    const month = String(calendarMonthDate.getMonth() + 1).padStart(2, "0");
    return {
      id: "tutorial-demo-calendar",
      version: "v1",
      locale: "en",
      firstName: "Alex",
      lastName: "Demo",
      phone: tutorialSettings.businessPhone,
      email: tutorialSettings.businessEmail,
      date: `${year}-${month}-15`,
      time: "20:00",
      guests: "2",
      occasion: "Birthday",
      notes: "Table by the window if possible.",
      status: "confirmed",
      isRead: false,
      createdAt: "2026-03-14T12:00:00.000Z",
    };
  }, [calendarMonthDate, tutorialSettings.businessEmail, tutorialSettings.businessPhone]);
  const confirmedReservationsToRender = useMemo(
    () => (isTutorialCalendarMode ? [tutorialCalendarReservation] : confirmedReservations),
    [confirmedReservations, isTutorialCalendarMode, tutorialCalendarReservation],
  );
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

    const reservationsByDay = new Map<number, AdminReservationRecord[]>();
    for (const reservation of confirmedReservationsToRender) {
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
    const cells: Array<{ day: number | null; reservations: AdminReservationRecord[] }> = [];
    for (let index = 0; index < totalCells; index += 1) {
      const day = index - firstDayWeekdayMondayIndex + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push({ day: null, reservations: [] });
      } else {
        cells.push({ day, reservations: reservationsByDay.get(day) ?? [] });
      }
    }

    return cells;
  }, [calendarMonthDate, confirmedReservationsToRender]);
  const selectedDayReservations = useMemo(() => {
    if (selectedCalendarDay === null) {
      return [];
    }
    const found = calendarCells.find((cell) => cell.day === selectedCalendarDay);
    return found?.reservations ?? [];
  }, [calendarCells, selectedCalendarDay]);
  const selectedCalendarDate = useMemo(() => {
    if (selectedCalendarDay === null) {
      return null;
    }

    return `${calendarMonthDate.getFullYear()}-${String(calendarMonthDate.getMonth() + 1).padStart(2, "0")}-${String(selectedCalendarDay).padStart(2, "0")}`;
  }, [calendarMonthDate, selectedCalendarDay]);
  const selectedDayClosures = useMemo(() => {
    if (!selectedCalendarDate) {
      return [];
    }

    return reservationClosures.filter((closure) => closure.date === selectedCalendarDate);
  }, [reservationClosures, selectedCalendarDate]);
  const workingHoursMondayFirst = useMemo(() => {
    return [...workingHours].sort(
      (a, b) => mondayFirstOrder.indexOf(a.weekday) - mondayFirstOrder.indexOf(b.weekday),
    );
  }, [workingHours]);

  useEffect(() => {
    setIsClosureToolsOpen(false);
    setIsManualReservationFormOpen(false);
    setManualReservationForm(defaultManualReservationForm);
  }, [selectedCalendarDate]);

  const loadAll = useCallback(async (showFullLoader = false, silentRefresh = false) => {
    if (showFullLoader) {
      setIsLoading(true);
    } else if (!silentRefresh) {
      setIsRefreshing(true);
    }
    setStatusMessage("");
    try {
      const [
        reservationResponse,
        reservationV2Response,
        menuResponse,
        workingHoursResponse,
        reservationClosuresResponse,
        messageTemplatesResponse,
        rewardProgramResponse,
        rewardCodesResponse,
        tutorialSettingsResponse,
      ] = await Promise.all([
        fetch("/api/reservations", { cache: "no-store" }),
        fetch("/api/reservations-v2", { cache: "no-store" }),
        fetch("/api/admin/menu", { cache: "no-store" }),
        fetch("/api/admin/working-hours", { cache: "no-store" }),
        fetch("/api/admin/reservation-closures", { cache: "no-store" }),
        fetch("/api/admin/message-templates", { cache: "no-store" }),
        fetch("/api/admin/reward-program", { cache: "no-store" }),
        fetch("/api/admin/reward-codes", { cache: "no-store" }),
        fetch("/api/admin/tutorial-settings", { cache: "no-store" }),
      ]);

      const reservationJson = (await reservationResponse.json()) as { data?: ReservationRecord[] };
      const reservationV2Json = (await reservationV2Response.json()) as {
        data?: ReservationV2Record[];
      };
      const menuJson = (await menuResponse.json()) as { data?: AdminMenuSection[] };
      const workingHoursJson = (await workingHoursResponse.json()) as {
        data?: AdminWorkingHours[];
      };
      const reservationClosuresJson = (await reservationClosuresResponse.json()) as {
        data?: AdminReservationClosure[];
      };
      const messageTemplatesJson = (await messageTemplatesResponse.json()) as {
        data?: AdminMessageTemplate[];
      };
      const rewardProgramJson = (await rewardProgramResponse.json()) as {
        data?: RewardProgramSettingsRecord;
      };
      const rewardCodesJson = (await rewardCodesResponse.json()) as {
        data?: RewardCodeRecord[];
      };
      const tutorialSettingsJson = (await tutorialSettingsResponse.json()) as {
        data?: AdminTutorialSettings;
      };

      setReservations([
        ...(reservationJson.data ?? []).map(toAdminReservationRecord),
        ...(reservationV2Json.data ?? []).map(toAdminReservationV2Record),
      ]);
      setMenuSections(menuJson.data ?? []);
      setWorkingHours(workingHoursJson.data ?? []);
      setReservationClosures(reservationClosuresJson.data ?? []);
      setMessageTemplates(messageTemplatesJson.data ?? []);
      setRewardProgram(rewardProgramJson.data ?? defaultRewardProgram);
      setRewardCodes(rewardCodesJson.data ?? []);
      setTutorialSettings(
        tutorialSettingsJson.data ?? {
          id: "default",
          businessPhone: "+351 933 357 555",
          businessEmail: "reservas@tlaloc.local",
        },
      );
      setNewItem((prev) =>
        prev.sectionId || !menuJson.data?.[0]?.id
          ? prev
          : { ...prev, sectionId: menuJson.data[0].id },
      );
    } catch {
      setStatusMessage("Could not load back office data.");
    } finally {
      setIsLoading(false);
      if (!silentRefresh) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const getAudioContextClass = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const browserWindow = window as Window &
      typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    return (
      (typeof globalThis.AudioContext !== "undefined" ? globalThis.AudioContext : undefined) ??
      browserWindow.webkitAudioContext ??
      null
    );
  }, []);

  const playAdminNotificationSound = useCallback(() => {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.22);
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.32);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.32);
    oscillator.onended = () => {
      void audioContext.close();
    };
  }, [getAudioContextClass]);

  const pushAdminToast = useCallback(
    (
      title: string,
      message: string,
      kind: AdminToast["kind"] = "default",
      theme: AdminToast["theme"] = "orange",
    ) => {
      const toastId = toastIdRef.current + 1;
      toastIdRef.current = toastId;
      setAdminToasts((current) => [...current, { id: toastId, title, message, kind, theme }]);
      const timeoutId = window.setTimeout(() => {
        setAdminToasts((current) => current.filter((toast) => toast.id !== toastId));
        toastTimeoutsRef.current = toastTimeoutsRef.current.filter((id) => id !== timeoutId);
      }, 5000);
      toastTimeoutsRef.current.push(timeoutId);
    },
    [],
  );

  const highlightReservationCard = useCallback((reservationId: string) => {
    setHighlightedReservationIds((current) =>
      current.includes(reservationId) ? current : [...current, reservationId],
    );

    const existingTimeout = highlightTimeoutsRef.current[reservationId];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    highlightTimeoutsRef.current[reservationId] = window.setTimeout(() => {
      setHighlightedReservationIds((current) => current.filter((id) => id !== reservationId));
      delete highlightTimeoutsRef.current[reservationId];
    }, 20000);
  }, []);

  const showDesktopReservationNotification = useCallback((event: AdminEvent) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const title = "New reservation";
    const body = `${event.guestName} · ${formatEuropeanDate(event.date)} at ${event.time}`;
    const notification = new Notification(title, { body, tag: `reservation-${event.reservationId}` });
    window.setTimeout(() => notification.close(), 7000);
  }, []);

  const dismissAdminToast = useCallback((toastId: number) => {
    setAdminToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const nextToastId = statusToastIdRef.current + 1;
    statusToastIdRef.current = nextToastId;
    setAdminStatusToast({ id: nextToastId, message: statusMessage });

    if (statusToastTimeoutRef.current) {
      clearTimeout(statusToastTimeoutRef.current);
    }
    statusToastTimeoutRef.current = window.setTimeout(() => {
      setAdminStatusToast((current) => (current?.id === nextToastId ? null : current));
      statusToastTimeoutRef.current = null;
    }, 3200);

    setStatusMessage("");
  }, [statusMessage]);

  const handleSoundAlertToggle = useCallback(
    (nextValue: boolean) => {
      if (!nextValue) {
        setAdminRealtimeSettings((current) => ({ ...current, soundEnabled: false }));
        return;
      }

      if (!getAudioContextClass()) {
        setAdminRealtimeSettings((current) => ({ ...current, soundEnabled: false }));
        setStatusMessage("Sound unavailable.");
        return;
      }

      setAdminRealtimeSettings((current) => ({ ...current, soundEnabled: true }));
    },
    [getAudioContextClass],
  );

  const handleDesktopNotificationToggle = useCallback(async (nextValue: boolean) => {
    if (!nextValue) {
      setAdminRealtimeSettings((current) => ({ ...current, desktopEnabled: false }));
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNativeNotificationPermission("unsupported");
      setStatusMessage("Browser notifications unsupported.");
      return;
    }

    if (Notification.permission === "granted") {
      setNativeNotificationPermission("granted");
      setAdminRealtimeSettings((current) => ({ ...current, desktopEnabled: true }));
      return;
    }

    const permission = await Notification.requestPermission();
    setNativeNotificationPermission(permission);
    if (permission === "granted") {
      setAdminRealtimeSettings((current) => ({ ...current, desktopEnabled: true }));
      return;
    }

    setAdminRealtimeSettings((current) => ({ ...current, desktopEnabled: false }));
    setStatusMessage("Browser notifications blocked.");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setNativeNotificationPermission("Notification" in window ? Notification.permission : "unsupported");

    const storedValue = window.localStorage.getItem("tlaloc-admin-realtime-settings");
    if (!storedValue) {
      setHasLoadedRealtimeSettings(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as Partial<AdminRealtimeSettings>;
      setAdminRealtimeSettings({
        soundEnabled: Boolean(parsed.soundEnabled),
        desktopEnabled: Boolean(parsed.desktopEnabled),
        notificationTheme:
          parsed.notificationTheme === "green" ||
          parsed.notificationTheme === "orange" ||
          parsed.notificationTheme === "neutral"
            ? parsed.notificationTheme
            : defaultAdminRealtimeSettings.notificationTheme,
      });
    } catch {
      window.localStorage.removeItem("tlaloc-admin-realtime-settings");
    } finally {
      setHasLoadedRealtimeSettings(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("tlaloc-admin-realtime-settings", JSON.stringify(adminRealtimeSettings));
  }, [adminRealtimeSettings]);

  useEffect(() => {
    if (nativeNotificationPermission === "denied" || nativeNotificationPermission === "unsupported") {
      setAdminRealtimeSettings((current) =>
        current.desktopEnabled ? { ...current, desktopEnabled: false } : current,
      );
    }
  }, [nativeNotificationPermission]);

  useEffect(() => {
    if (!hasLoadedRealtimeSettings || hasShownRealtimeSelfTestRef.current) {
      return;
    }

    hasShownRealtimeSelfTestRef.current = true;

    if (adminRealtimeSettings.soundEnabled) {
      playAdminNotificationSound();
    }

    if (adminRealtimeSettings.desktopEnabled) {
      showDesktopReservationNotification({
        type: "reservation_created",
        reservationId: "self-test",
        reservationVersion: "v2",
        guestName: "Notification test",
        date: getLisbonTodayIso(),
        time: getLisbonCurrentTimeLabel(),
        createdAt: new Date().toISOString(),
      });
    }
  }, [
    adminRealtimeSettings.desktopEnabled,
    adminRealtimeSettings.soundEnabled,
    hasLoadedRealtimeSettings,
    playAdminNotificationSound,
    showDesktopReservationNotification,
  ]);

  useEffect(() => {
    const toastTimeoutsRefCurrent = toastTimeoutsRef;
    const highlightTimeoutsRefCurrent = highlightTimeoutsRef;

    return () => {
      const toastTimeouts = toastTimeoutsRefCurrent.current;
      const highlightTimeouts = highlightTimeoutsRefCurrent.current;

      for (const timeoutId of toastTimeouts) {
        clearTimeout(timeoutId);
      }
      if (statusToastTimeoutRef.current) {
        clearTimeout(statusToastTimeoutRef.current);
      }
      for (const timeoutId of Object.values(highlightTimeouts)) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    void loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    const nextTab = getTabFromSearchParams(searchParams) ?? "reservations";
    setActiveTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, [searchParams]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const handleReservationCreated = (message: Event) => {
      const event = JSON.parse((message as MessageEvent<string>).data) as AdminEvent;
      pushAdminToast(
        "New reservation",
        `${event.guestName} · ${formatEuropeanDate(event.date)} at ${event.time}`,
        "reservation",
        adminRealtimeSettings.notificationTheme,
      );
      highlightReservationCard(event.reservationId);
      if (adminRealtimeSettings.soundEnabled) {
        playAdminNotificationSound();
      }
      if (adminRealtimeSettings.desktopEnabled) {
        showDesktopReservationNotification(event);
      }
      void loadAll(false, true);
    };

    const connect = () => {
      if (isDisposed) {
        return;
      }

      eventSource = new EventSource("/api/admin/reservations/stream");
      eventSource.addEventListener("reservation_created", handleReservationCreated);
      eventSource.onerror = () => {
        eventSource?.close();
        if (!isDisposed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      eventSource?.removeEventListener("reservation_created", handleReservationCreated);
      eventSource?.close();
    };
  }, [
    adminRealtimeSettings.desktopEnabled,
    adminRealtimeSettings.notificationTheme,
    adminRealtimeSettings.soundEnabled,
    highlightReservationCard,
    loadAll,
    playAdminNotificationSound,
    pushAdminToast,
    showDesktopReservationNotification,
  ]);

  useEffect(() => {
    if (selectedCalendarDay === null) {
      return;
    }
    const exists = calendarCells.some((cell) => cell.day === selectedCalendarDay);
    if (!exists) {
      setSelectedCalendarDay(null);
    }
  }, [calendarCells, selectedCalendarDay]);

  useEffect(() => {
    if (!isTutorialCalendarMode) {
      return;
    }
    const tutorialDay = calendarCells.find((cell) =>
      cell.reservations.some((reservation) => reservation.id === "tutorial-demo-calendar"),
    )?.day;
    if (tutorialDay === null || tutorialDay === undefined) {
      return;
    }
    if (selectedCalendarDay !== tutorialDay) {
      setSelectedCalendarDay(tutorialDay);
    }
  }, [calendarCells, isTutorialCalendarMode, selectedCalendarDay]);

  useEffect(() => {
    if (!isTutorialMode) {
      return;
    }
    const stepCard = tutorialStepRefs.current[tutorialStepIndex];
    if (!stepCard) {
      return;
    }
    stepCard.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, [isTutorialMode, tutorialStepIndex]);

  const handleTutorialGoTo = useCallback(
    (tab: TabId, stepIndex: number) => {
      setTutorialStepIndex(stepIndex);
      navigateToTab(tab);
      setIsTutorialInProgress(true);
      setIsTutorialMode(false);
    },
    [navigateToTab],
  );

  const handleHideTutorial = useCallback(() => {
    setIsTutorialMode(false);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setIsTutorialMode(false);
    setIsTutorialInProgress(false);
    setTutorialStepIndex(0);
    setTutorialDemoStatus("new");
    setTutorialDemoIsRead(false);
  }, []);

  const handleToggleTutorial = useCallback(() => {
    if (isTutorialMode) {
      handleCloseTutorial();
      return;
    }
    setIsTutorialInProgress(true);
    setIsTutorialMode(true);
  }, [handleCloseTutorial, isTutorialMode]);

  async function runAction(key: string, action: () => Promise<void>) {
    setActionKey(key);
    try {
      await action();
    } finally {
      setActionKey(null);
    }
  }

  async function changeReservationStatus(id: string, status: AdminReservationRecord["status"]) {
    const current = reservations.find((reservation) => reservation.id === id);
    if (current?.status === status) {
      return;
    }

    await runAction(`reservation-${id}-${status}`, async () => {
      const route =
        current?.version === "v2"
          ? `/api/admin/reservations-v2/${id}/status`
          : `/api/admin/reservations/${id}/status`;
      const response = await fetch(route, {
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

  async function createCalendarClosure() {
    if (!selectedCalendarDate) {
      setStatusMessage("Select a day in the calendar first.");
      return;
    }

    await runAction("create-calendar-closure", async () => {
      const response = await fetch("/api/admin/reservation-closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedCalendarDate,
          startTime: closureForm.startTime,
          endTime: closureForm.endTime,
          note: closureForm.note,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not create closure window.");
        return;
      }

      setClosureForm((prev) => ({ ...prev, note: "" }));
      setStatusMessage("Reservation window closed for that day.");
      await loadAll();
    });
  }

  async function createManualCalendarReservation() {
    if (!selectedCalendarDate) {
      setStatusMessage("Select a day in the calendar first.");
      return;
    }

    if (manualReservationValidationError) {
      setStatusMessage(manualReservationValidationError);
      return;
    }

    await runAction("create-manual-calendar-reservation", async () => {
      const response = await fetch("/api/admin/reservations-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualReservationForm,
          date: selectedCalendarDate,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not create reservation.");
        return;
      }

      setManualReservationForm(defaultManualReservationForm);
      setIsManualReservationFormOpen(false);
      setStatusMessage("Reservation added to confirmed calendar.");
      await loadAll();
    });
  }

  async function deleteCalendarClosure(id: string) {
    await runAction(`delete-closure-${id}`, async () => {
      const response = await fetch(`/api/admin/reservation-closures/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatusMessage("Could not remove closure window.");
        return;
      }

      setStatusMessage("Closure window removed.");
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

  async function saveTutorialSettingsConfiguration() {
    await runAction("save-tutorial-settings", async () => {
      const response = await fetch("/api/admin/tutorial-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessPhone: tutorialSettings.businessPhone,
          businessEmail: tutorialSettings.businessEmail,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not save tutorial settings.");
        return;
      }

      setStatusMessage("Business contact updated.");
      await loadAll();
    });
  }

  async function saveRewardProgramConfiguration() {
    await runAction("save-reward-program", async () => {
      const response = await fetch("/api/admin/reward-program", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: rewardProgram.isEnabled,
          visitThreshold: rewardProgram.visitThreshold,
          rewardType: rewardProgram.rewardType,
          rewardValue: rewardProgram.rewardValue,
          rewardLabel: rewardProgram.rewardLabel,
          messageEn: rewardProgram.messageEn,
          messagePt: rewardProgram.messagePt,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not save reward program.");
        return;
      }

      setStatusMessage("Reward program updated.");
      await loadAll();
    });
  }

  function lookupRewardCode() {
    const normalizedCode = rewardLookupCode.trim().toUpperCase();
    if (!normalizedCode) {
      setRewardLookupResult(null);
      setRewardLookupFeedback("Enter a promo code first.");
      return;
    }

    const match =
      rewardCodes.find((rewardCode) => rewardCode.code.toUpperCase() === normalizedCode) ?? null;
    setRewardLookupResult(match);
    setRewardLookupFeedback(match ? "" : "Promo code not found.");
  }

  async function redeemLookupRewardCode() {
    const normalizedCode = rewardLookupCode.trim().toUpperCase();
    if (!normalizedCode) {
      setRewardLookupResult(null);
      setRewardLookupFeedback("Enter a promo code first.");
      return;
    }

    await runAction("redeem-reward-lookup", async () => {
      const response = await fetch("/api/admin/reward-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: { isValid?: boolean; reason?: string; code?: RewardCodeRecord };
      };

      if (!response.ok) {
        setRewardLookupFeedback(json.error ?? "Could not redeem promo code.");
        return;
      }

      if (!json.data?.isValid) {
        setRewardLookupFeedback(
          json.data?.reason === "inactive" ? "Code is already used or cancelled." : "Promo code not found.",
        );
        return;
      }

      setRewardLookupFeedback(`Redeemed: ${json.data.code?.code ?? normalizedCode}`);
      await loadAll();
      setRewardLookupResult(json.data.code ?? null);
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
      const current = reservations.find((reservation) => reservation.id === id);
      const route =
        current?.version === "v2"
          ? `/api/admin/reservations-v2/${id}`
          : `/api/admin/reservations/${id}`;
      const response = await fetch(route, {
        method: "PATCH",
      });

      if (!response.ok) {
        setStatusMessage("Could not mark reservation as read.");
        return;
      }

      await loadAll();
    });
  }

  async function clearRedeemedRewardCodes() {
    await runAction("clear-redeemed-reward-codes", async () => {
      const response = await fetch("/api/admin/reward-codes", {
        method: "DELETE",
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: { deletedCount?: number };
      };

      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not clean redeemed reward codes.");
        return;
      }

      const deletedCount = json.data?.deletedCount ?? 0;
      setRewardLookupResult((current) => (current?.status === "used" ? null : current));
      setRewardLookupFeedback((current) =>
        current === "Promo code not found." ? current : "",
      );
      setStatusMessage(
        deletedCount === 1 ? "1 redeemed reward code removed." : `${deletedCount} redeemed reward codes removed.`,
      );
      await loadAll();
    });
  }

  async function confirmDeleteReservation() {
    if (!deleteReservationModal) {
      return;
    }

    const reservationId = deleteReservationModal.id;
    await runAction(`delete-reservation-${reservationId}`, async () => {
      const current = reservations.find((reservation) => reservation.id === reservationId);
      const route =
        current?.version === "v2"
          ? `/api/admin/reservations-v2/${reservationId}`
          : `/api/admin/reservations/${reservationId}`;
      const response = await fetch(route, {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatusMessage(
          current?.version === "v2"
            ? "Could not archive reservation."
            : "Could not delete reservation.",
        );
        return;
      }

      setDeleteReservationModal(null);
      await loadAll();
    });
  }

  return (
    <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
      {activeTab === "today" ? (
        <div>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigateToTab("reservations")}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}
            aria-label="Back to back office sections"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            className={`btn ${activeTab === "reservations" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("reservations")}
            type="button"
          >
            Reservations
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigateToTab("today")}
            type="button"
          >
            Today
          </button>
          <button
            className={`btn ${activeTab === "calendar" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("calendar")}
            type="button"
          >
            Confirmed Calendar
          </button>
          <button
            className={`btn ${activeTab === "metrics" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("metrics")}
            type="button"
          >
            Metrics
          </button>
          <button
            className={`btn ${activeTab === "rewards" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("rewards")}
            type="button"
          >
            Reward Program (Beta)
          </button>
          <button
            className={`btn ${activeTab === "menu" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("menu")}
            type="button"
          >
            Menu Configuration
          </button>
          <button
            className={`btn ${activeTab === "security" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("security")}
            type="button"
          >
            Settings
          </button>
          <button
            className={`btn ${activeTab === "hours" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigateToTab("hours")}
            type="button"
          >
            Working Hours
          </button>
          <button
            className={`btn ${isTutorialMode || isTutorialInProgress ? "btn-primary" : "btn-secondary"}`}
            type="button"
            onClick={handleToggleTutorial}
          >
            {isTutorialMode ? "Exit tutorial mode" : "Tutorial mode"}
          </button>
        </div>
      )}

      <AnimatePresence>
        {adminToasts.length > 0 ? (
          <div className="admin-toast-stack" aria-live="polite" aria-atomic="true">
            {adminToasts.map((toast) => (
              <motion.div
                key={toast.id}
                className={`admin-toast ${
                  toast.kind === "reservation" ? `admin-toast-theme-${toast.theme ?? "orange"}` : ""
                }`}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
              >
                <div>
                  <strong>{toast.title}</strong>
                  <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                    {toast.message}
                  </p>
                </div>
                <button
                  className={`btn btn-secondary btn-icon ${toast.kind === "reservation" ? "admin-toast-close-reservation" : ""}`}
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismissAdminToast(toast.id)}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {adminStatusToast || isLoading ? (
          <div className="admin-status-toast-wrap">
            <motion.div
              key={adminStatusToast ? adminStatusToast.id : "loading"}
              className={`admin-status-toast ${isLoading ? "admin-status-toast-loading" : ""}`}
              aria-live="polite"
              aria-label={adminStatusToast ? undefined : "Loading data"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {adminStatusToast ? (
                adminStatusToast.message
              ) : (
                <span className="admin-status-loader-ring" aria-hidden="true" />
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isRefreshing ? (
          <motion.div
            className="sync-overlay-badge"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            Syncing with database...
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isTutorialMode ? (
          <motion.div
            className="tutorial-overlay"
            role="dialog"
            aria-modal="false"
            aria-label="Back Office Tutorial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.section
              className="card tutorial-mode-card tutorial-overlay-panel"
              initial={{ y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 26, opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="tutorial-overlay-head">
                <h3>Back Office Tutorial</h3>
                <button className="btn btn-secondary" type="button" onClick={handleHideTutorial}>
                  Hide
                </button>
              </div>
              <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                Recommended workflow: inbox first, communicate with guest, update status, and mark as
                read when done.
              </p>
              <div className="tutorial-steps">
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[0] = element;
                  }}
                >
                  <strong>1) Pending Inbox</strong>
                  <p className="footer-note">
                    Open <em>Reservations</em>. New requests appear here in chronological order. Use
                    EN/PT badge to know message language.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleTutorialGoTo("reservations", 1)}
                  >
                    Go to Reservations
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Opens Reservations tab and closes tutorial until you continue.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[1] = element;
                  }}
                >
                  <strong>2) Contact the Guest</strong>
                  <p className="footer-note">
                    Click phone (WhatsApp) or email. Message is prefilled from templates with
                    reservation variables.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      navigateToTab("reservations");
                      setTutorialStepIndex(2);
                      handleHideTutorial();
                    }}
                  >
                    Try it
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Hides tutorial module so you can test phone/email actions on the card.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[2] = element;
                  }}
                >
                  <strong>3) Update Status</strong>
                  <p className="footer-note">
                    Use New / Confirmed / Cancelled. Confirmed reservations also appear in calendar.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      navigateToTab("reservations");
                      setTutorialStepIndex(3);
                      handleHideTutorial();
                    }}
                  >
                    Try it
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Hides tutorial module so you can test New/Confirmed/Cancelled actions on a card.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[3] = element;
                  }}
                >
                  <strong>4) Clean Inbox</strong>
                  <p className="footer-note">
                    Click the check icon to mark as read. Use <em>Show read reservations</em> if you
                    need to revisit cleaned items.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      navigateToTab("reservations");
                      setTutorialStepIndex(4);
                      handleHideTutorial();
                    }}
                  >
                    Try it
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Hides tutorial so you can mark the card as read; continuing goes to calendar.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[4] = element;
                  }}
                >
                  <strong>5) Confirmed Calendar</strong>
                  <p className="footer-note">
                    Review confirmed bookings by date and quickly navigate across months.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleTutorialGoTo("calendar", 5)}
                  >
                    Go to Confirmed Calendar
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Opens Confirmed Calendar and keeps tutorial step remembered.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[5] = element;
                  }}
                >
                  <strong>6) Configure Messages (Optional)</strong>
                  <p className="footer-note">
                    FYI: in <em>Settings → Message Templates</em>, you can edit EN/PT templates and
                    variables like{" "}
                    {"{firstName}"}, {"{date}"}, {"{time}"}, {"{guests}"}.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleTutorialGoTo("security", 6)}
                  >
                    Open Settings (Optional)
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Optional step. Opens Settings and advances tutorial.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[6] = element;
                  }}
                >
                  <strong>7) Manage Working Hours (Optional)</strong>
                  <p className="footer-note">
                    FYI: set opening hours and bulk updates. Reservation form enforces these slots.
                  </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleTutorialGoTo("hours", 7)}
                  >
                    Open Working Hours (Optional)
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Optional step. Opens Working Hours and advances tutorial.
                  </p>
                </article>
                <article
                  className="tutorial-step"
                  ref={(element) => {
                    tutorialStepRefs.current[7] = element;
                  }}
                >
                  <strong>8) Finish Tutorial</strong>
                  <p className="footer-note">
                    End tutorial mode and clear all tutorial hints and progress state.
                  </p>
                  <button className="btn btn-secondary" type="button" onClick={handleCloseTutorial}>
                    Finish tutorial
                  </button>
                  <p className="footer-note tutorial-action-note">
                    Exits tutorial mode completely and hides the continue button.
                  </p>
                </article>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {isTutorialInProgress && !isTutorialMode ? (
        <button
          className="btn btn-primary tutorial-continue-btn"
          type="button"
          onClick={() => setIsTutorialMode(true)}
        >
          Continue tutorial
        </button>
      ) : null}

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
          {isLoading && !isTutorialReservationMode ? (
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
          ) : reservationsToRender.length === 0 ? (
            <div className="card">No reservations in inbox.</div>
          ) : (
            reservationsToRender.map((reservation) => (
              <article
                className={`card reservation-anchor-card ${
                  highlightedReservationIds.includes(reservation.id) ? "reservation-card-fresh" : ""
                }`}
                key={reservation.id}
                id={`reservation-card-${reservation.id}`}
              >
                <div className="reservation-card-actions">
                  <button
                    className={`icon-btn reservation-delete-corner-btn ${reservation.isRead ? "read-icon-btn" : ""}`}
                    type="button"
                    id={`reservation-read-btn-${reservation.id}`}
                    aria-label={`${reservation.isRead ? "Already read" : "Mark as read"} for ${reservation.firstName} ${reservation.lastName}`}
                    title={reservation.isRead ? "Already read" : "Mark as read"}
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        setTutorialDemoIsRead(true);
                        return;
                      }
                      void markReservationRead(reservation.id);
                    }}
                    disabled={
                      reservation.id === "tutorial-demo-reservation"
                        ? tutorialDemoIsRead
                        : actionKey !== null || reservation.isRead
                    }
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
                    id={`reservation-delete-btn-${reservation.id}`}
                    aria-label={`Delete reservation for ${reservation.firstName} ${reservation.lastName}`}
                    title="Delete reservation"
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        return;
                      }
                      setDeleteReservationModal({
                        id: reservation.id,
                        guestName: `${reservation.firstName} ${reservation.lastName}`,
                      });
                    }}
                    disabled={reservation.id === "tutorial-demo-reservation" || actionKey !== null}
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
                {reservationTutorialHintMode ? (
                  <ReservationAnchorHints
                    reservationId={reservation.id}
                    mode={reservationTutorialHintMode}
                  />
                ) : null}
                <div className="reservation-meta-row">
                  <p className="footer-note" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                    Reservation #{reservation.id.slice(0, 8)}
                  </p>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    <span className="pill reservation-locale-chip">
                      {getMessageLanguageLabel(reservation)}
                    </span>
                    <span className="pill reservation-locale-chip">{reservation.version}</span>
                  </div>
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
                    id={`reservation-phone-link-${reservation.id}`}
                    href={toWhatsAppUrl(reservation.phone, reservation, messageTemplates)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reservation.phone}
                  </a>
                </p>
                <p>
                  <a
                    id={`reservation-email-link-${reservation.id}`}
                    href={toEmailUrl(reservation.email, reservation, messageTemplates)}
                  >
                    {reservation.email}
                  </a>
                </p>
                {(() => {
                  const activeRewardCode = getActiveRewardCodeForReservation(reservation, rewardCodes);
                  return activeRewardCode ? (
                    <div className="card admin-reward-card">
                      <div className="admin-reward-head">
                        <strong>Guest reward</strong>
                        <span className="pill reservation-locale-chip">{activeRewardCode.status}</span>
                      </div>
                      <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                        <strong>{activeRewardCode.code}</strong> · {activeRewardCode.rewardLabel}
                      </p>
                      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        <a
                          className="btn btn-secondary"
                          href={toRewardWhatsAppUrl(reservation.phone, activeRewardCode, reservation.locale)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Send reward WhatsApp
                        </a>
                        <a
                          className="btn btn-secondary"
                          href={toRewardEmailUrl(reservation.email, activeRewardCode, reservation.locale)}
                        >
                          Send reward email
                        </a>
                      </div>
                    </div>
                  ) : null;
                })()}
                {hasReservationExtraDetails(reservation) ? (
                  <details className="reservation-extra-details">
                    <summary>More details</summary>
                    {reservation.version === "v1" ? (
                      <>
                        <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                          <strong>Occasion:</strong>{" "}
                          {reservation.occasion?.trim() ? reservation.occasion : "-"}
                        </p>
                        <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                          <strong>Special requests:</strong>{" "}
                          {reservation.notes?.trim() ? reservation.notes : "-"}
                        </p>
                      </>
                    ) : (
                      <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                        <strong>Other information:</strong>{" "}
                        {reservation.notes?.trim() ? reservation.notes : "-"}
                      </p>
                    )}
                  </details>
                ) : null}
                <div
                  id={`reservation-status-actions-${reservation.id}`}
                  style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}
                >
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={reservation.id === "tutorial-demo-reservation" ? false : actionKey !== null}
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        setTutorialDemoStatus("new");
                        return;
                      }
                      void changeReservationStatus(reservation.id, "new");
                    }}
                  >
                    {reservation.id !== "tutorial-demo-reservation" && actionKey === `reservation-${reservation.id}-new`
                      ? "Updating..."
                      : "New"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={reservation.id === "tutorial-demo-reservation" ? false : actionKey !== null}
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        setTutorialDemoStatus("confirmed");
                        return;
                      }
                      void changeReservationStatus(reservation.id, "confirmed");
                    }}
                  >
                    {reservation.id !== "tutorial-demo-reservation" && actionKey === `reservation-${reservation.id}-confirmed`
                      ? "Updating..."
                      : "Confirmed"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={reservation.id === "tutorial-demo-reservation" ? false : actionKey !== null}
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        setTutorialDemoStatus("cancelled");
                        return;
                      }
                      void changeReservationStatus(reservation.id, "cancelled");
                    }}
                  >
                    {reservation.id !== "tutorial-demo-reservation" && actionKey === `reservation-${reservation.id}-cancelled`
                      ? "Updating..."
                      : "Cancelled"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={reservation.id === "tutorial-demo-reservation" ? false : actionKey !== null}
                    onClick={() => {
                      if (reservation.id === "tutorial-demo-reservation") {
                        setTutorialDemoStatus("no_show");
                        return;
                      }
                      void changeReservationStatus(reservation.id, "no_show");
                    }}
                  >
                    {reservation.id !== "tutorial-demo-reservation" && actionKey === `reservation-${reservation.id}-no_show`
                      ? "Updating..."
                      : "No show"}
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

      {activeTab === "today" ? (
        <section style={{ display: "grid", gap: "0.9rem" }}>
          <section className="card admin-today-card">
            <p className="footer-note admin-chart-subtitle" style={{ marginTop: 0 }}>
              {formatEuropeanDate(todayTimeline.date)} in Lisbon time.
            </p>

            {todayTimeline.timelineReservations.length === 0 ? (
              <p className="footer-note" style={{ marginTop: 0 }}>
                No active reservations left for today.
              </p>
            ) : (
              <div className="admin-today-timeline">
                {todayTimeline.timelineReservations.map((reservation, index) => (
                  <div key={reservation.id}>
                    {todayTimeline.markerIndex === index ? (
                      <div className="admin-today-marker">
                        <span className="admin-today-marker-line" />
                      </div>
                    ) : null}
                    <div className="admin-today-row">
                      <div className="admin-today-time-rail">
                        <p className="admin-today-time">{reservation.time}</p>
                        <span className="admin-today-rail-line" />
                      </div>
                      <article
                        className={`card admin-today-item ${
                          todayTimeline.currentReservationIds.includes(reservation.id) ? "admin-today-item-live" : ""
                        }`}
                      >
                        <div className="admin-today-item-head">
                          <div>
                            <strong>
                              {reservation.firstName} {reservation.lastName}
                            </strong>
                            <p className="footer-note admin-today-meta">
                              {reservation.guests} guests
                              {reservation.notes?.trim() ? ` · ${reservation.notes.trim()}` : ""}
                            </p>
                          </div>
                          <div className="admin-today-badges">
                            {!reservation.isRead ? (
                              <span className="pill reservation-status reservation-status-new">Unread</span>
                            ) : null}
                            <span className={`pill reservation-status reservation-status-${reservation.status}`}>
                              {reservation.status}
                            </span>
                          </div>
                        </div>

                        <div className="admin-today-links">
                          <a
                            className="btn btn-secondary"
                            href={toWhatsAppUrl(reservation.phone, reservation, messageTemplates)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {reservation.phone}
                          </a>
                          {!reservation.isRead ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              disabled={actionKey !== null}
                              onClick={() => void markReservationRead(reservation.id)}
                            >
                              Read
                            </button>
                          ) : null}
                          {reservation.status !== "confirmed" ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              disabled={actionKey !== null}
                              onClick={() => void changeReservationStatus(reservation.id, "confirmed")}
                            >
                              {actionKey === `reservation-${reservation.id}-confirmed` ? "Updating..." : "Confirm"}
                            </button>
                          ) : null}
                          {reservation.status !== "cancelled" ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              disabled={actionKey !== null}
                              onClick={() => void changeReservationStatus(reservation.id, "cancelled")}
                            >
                              {actionKey === `reservation-${reservation.id}-cancelled` ? "Updating..." : "Cancel"}
                            </button>
                          ) : null}
                          {reservation.status !== "no_show" ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              disabled={actionKey !== null}
                              onClick={() => void changeReservationStatus(reservation.id, "no_show")}
                            >
                              {actionKey === `reservation-${reservation.id}-no_show` ? "Updating..." : "No show"}
                            </button>
                          ) : null}
                        </div>
                      </article>
                    </div>
                  </div>
                ))}
                {todayTimeline.markerIndex === todayTimeline.timelineReservations.length ? (
                  <div className="admin-today-marker">
                    <span className="admin-today-marker-line" />
                  </div>
                ) : null}
              </div>
            )}

            <section className="admin-today-closed">
              <div className="admin-today-section-head">
                <div>
                  <h4>Closed today</h4>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    Cancelled and no-show reservations, kept out of the live timeline.
                  </p>
                </div>
                <span className="pill reservation-locale-chip">{todayTimeline.closedReservations.length}</span>
              </div>

              {todayTimeline.closedReservations.length === 0 ? (
                <p className="footer-note" style={{ marginTop: 0 }}>
                  No cancelled or no-show reservations today.
                </p>
              ) : (
                <div className="admin-today-closed-list">
                  {todayTimeline.closedReservations.map((reservation) => (
                    <div className="admin-today-closed-row" key={reservation.id}>
                      <div>
                        <strong>
                          {reservation.time} · {reservation.firstName} {reservation.lastName}
                        </strong>
                        <p className="footer-note" style={{ marginTop: "0.15rem" }}>
                          {reservation.guests} guests
                        </p>
                      </div>
                      <span className={`pill reservation-status reservation-status-${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
      ) : null}

      {activeTab === "metrics" ? (
        <section style={{ display: "grid", gap: "0.9rem" }}>
          <section className="admin-metrics-grid">
            {reservationDashboard.cards.map((metric) => (
              <article className="card admin-metric-card" key={metric.label}>
                <p className="admin-metric-label">{metric.label}</p>
                <strong className="admin-metric-value">{metric.value}</strong>
                <p className="footer-note admin-metric-note">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="admin-dashboard-grid">
            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h3>Status mix</h3>
                <p className="footer-note admin-chart-subtitle">All reservations in the system</p>
              </div>
              <div className="admin-chart-list">
                {reservationDashboard.statusBreakdown.map((item) => (
                  <div className="admin-chart-row" key={item.label}>
                    <div className="admin-chart-meta">
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                    <div className="admin-chart-track">
                      <div
                        className="admin-chart-fill"
                        style={{
                          width: `${Math.max(
                            reservationDashboard.statusBreakdown.some((entry) => entry.value > 0)
                              ? (item.value /
                                Math.max(...reservationDashboard.statusBreakdown.map((entry) => entry.value), 1)) *
                              100
                              : 0,
                            item.value > 0 ? 10 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h3>Guest reward</h3>
                <p className="footer-note admin-chart-subtitle">
                  Matched by phone or email across reservation history
                </p>
              </div>
              {reservationDashboard.topReturningGuests.length === 0 ? (
                <p className="footer-note" style={{ marginTop: 0 }}>
                  No guest reward identified yet.
                </p>
              ) : (
                <div className="admin-chart-list">
                  {reservationDashboard.topReturningGuests.map((item) => (
                    <div className="admin-chart-row" key={item.label}>
                      <div className="admin-chart-meta">
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <div className="admin-chart-track">
                        <div
                          className="admin-chart-fill admin-chart-fill-secondary"
                          style={{
                            width: `${Math.max(
                              reservationDashboard.topReturningGuests.some((entry) => entry.value > 0)
                                ? (item.value /
                                  Math.max(...reservationDashboard.topReturningGuests.map((entry) => entry.value), 1)) *
                                100
                                : 0,
                              item.value > 0 ? 10 : 0,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="admin-chart-note">{item.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h3>Upcoming demand by weekday</h3>
                <p className="footer-note admin-chart-subtitle">Confirmed covers in the next 30 days</p>
              </div>
              <div className="admin-chart-list">
                {reservationDashboard.weekdayDemand.map((item) => (
                  <div className="admin-chart-row" key={item.label}>
                    <div className="admin-chart-meta">
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                    <div className="admin-chart-track">
                      <div
                        className="admin-chart-fill"
                        style={{
                          width: `${Math.max(
                            reservationDashboard.weekdayDemand.some((entry) => entry.value > 0)
                              ? (item.value /
                                Math.max(...reservationDashboard.weekdayDemand.map((entry) => entry.value), 1)) *
                              100
                              : 0,
                            item.value > 0 ? 10 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="admin-chart-note">{item.note}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h3>Top time slots</h3>
                <p className="footer-note admin-chart-subtitle">Most booked confirmed times in next 30 days</p>
              </div>
              {reservationDashboard.topTimeSlots.length === 0 ? (
                <p className="footer-note" style={{ marginTop: 0 }}>
                  {reservationDashboard.hasUpcomingData
                    ? "No repeated time-slot pattern yet."
                    : "No upcoming confirmed reservations yet."}
                </p>
              ) : (
                <div className="admin-chart-list">
                  {reservationDashboard.topTimeSlots.map((item) => (
                    <div className="admin-chart-row" key={item.label}>
                      <div className="admin-chart-meta">
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <div className="admin-chart-track">
                        <div
                          className="admin-chart-fill admin-chart-fill-secondary"
                          style={{
                            width: `${Math.max(
                              reservationDashboard.topTimeSlots.some((entry) => entry.value > 0)
                                ? (item.value /
                                  Math.max(...reservationDashboard.topTimeSlots.map((entry) => entry.value), 1)) *
                                100
                                : 0,
                              item.value > 0 ? 10 : 0,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="admin-chart-note">{item.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </section>
      ) : null}

      {activeTab === "rewards" ? (
        <section className="card admin-reward-program-card">
          <div className="admin-chart-head">
            <h3>Reward program</h3>
            <p className="footer-note admin-chart-subtitle">
              Generate one active code per guest after enough confirmed visits.
            </p>
          </div>
          <div className="form-grid" style={{ marginTop: "0.6rem" }}>
            <label className="ios-switch-field" style={{ marginBottom: 0, alignSelf: "center" }}>
              <input
                className="ios-switch-input"
                type="checkbox"
                checked={rewardProgram.isEnabled}
                onChange={(event) =>
                  setRewardProgram((prev) => ({ ...prev, isEnabled: event.target.checked }))
                }
              />
              <span className="ios-switch" aria-hidden="true" />
              Reward program enabled
            </label>
            <div>
              <label>Confirmed visits needed</label>
              <input
                type="number"
                min={1}
                value={rewardProgram.visitThreshold}
                onChange={(event) =>
                  setRewardProgram((prev) => ({
                    ...prev,
                    visitThreshold: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
              />
            </div>
            <div>
              <label>Reward type</label>
              <select
                value={rewardProgram.rewardType}
                onChange={(event) =>
                  setRewardProgram((prev) => ({
                    ...prev,
                    rewardType: event.target.value as RewardType,
                  }))
                }
              >
                <option value="percent">Percent off</option>
                <option value="fixed_amount">Fixed amount off</option>
                <option value="free_item">Free item</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label>Reward value</label>
              <input
                value={rewardProgram.rewardValue}
                onChange={(event) =>
                  setRewardProgram((prev) => ({ ...prev, rewardValue: event.target.value }))
                }
              />
            </div>
            <div>
              <label>Reward label</label>
              <input
                value={rewardProgram.rewardLabel}
                onChange={(event) =>
                  setRewardProgram((prev) => ({ ...prev, rewardLabel: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: "0.75rem" }}>
            <div>
              <label>Reward message EN</label>
              <textarea
                value={rewardProgram.messageEn ?? ""}
                onChange={(event) =>
                  setRewardProgram((prev) => ({ ...prev, messageEn: event.target.value }))
                }
              />
            </div>
            <div>
              <label>Reward message PT</label>
              <textarea
                value={rewardProgram.messagePt ?? ""}
                onChange={(event) =>
                  setRewardProgram((prev) => ({ ...prev, messagePt: event.target.value }))
                }
              />
            </div>
          </div>
          <p className="footer-note" style={{ marginTop: "0.35rem" }}>
            You can use <code>{"{code}"}</code> and <code>{"{rewardLabel}"}</code> in reward messages.
          </p>
          <div style={{ marginTop: "0.8rem" }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={actionKey !== null}
              onClick={() => {
                void saveRewardProgramConfiguration();
              }}
            >
              {actionKey === "save-reward-program" ? "Saving..." : "Save reward program"}
            </button>
          </div>
          <div className="admin-reward-codes-grid">
            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h4>Find promo code</h4>
                <p className="footer-note admin-chart-subtitle">
                  Search by code and see who it was generated for.
                </p>
              </div>
              <div className="admin-reward-actions">
                <input
                  placeholder="Enter promo code"
                  value={rewardLookupCode}
                  onChange={(event) => setRewardLookupCode(event.target.value.toUpperCase())}
                />
                <button className="btn btn-secondary" type="button" onClick={lookupRewardCode}>
                  Find code
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={actionKey !== null || !rewardLookupResult || rewardLookupResult.status !== "active"}
                  onClick={() => void redeemLookupRewardCode()}
                >
                  {actionKey === "redeem-reward-lookup" ? "Redeeming..." : "Redeem"}
                </button>
              </div>
              {rewardLookupFeedback ? (
                <p className="footer-note" style={{ marginTop: "0.35rem" }}>
                  {rewardLookupFeedback}
                </p>
              ) : null}
              {rewardLookupResult ? (
                <div className="card admin-reward-card" style={{ marginTop: "0.6rem" }}>
                  <div className="admin-reward-head">
                    <strong>{rewardLookupResult.code}</strong>
                    <span className="pill reservation-locale-chip">{rewardLookupResult.status}</span>
                  </div>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Guest:</strong> {rewardLookupResult.guestName || "-"}
                  </p>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Email key:</strong> {rewardLookupResult.emailKey || "-"}
                  </p>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Phone key:</strong> {rewardLookupResult.phoneKey || "-"}
                  </p>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Reward:</strong> {rewardLookupResult.rewardLabel}
                  </p>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Generated after:</strong> {rewardLookupResult.generatedAfterConfirmedCount} confirmed visits
                  </p>
                  <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                    <strong>Created:</strong> {rewardLookupResult.createdAt.slice(0, 10)}
                  </p>
                  {rewardLookupResult.usedAt ? (
                    <p className="footer-note" style={{ marginTop: "0.2rem" }}>
                      <strong>Used:</strong> {rewardLookupResult.usedAt.slice(0, 10)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>

            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h4>Active reward codes</h4>
              </div>
              {rewardCodes.filter((code) => code.status === "active").length === 0 ? (
                <p className="footer-note" style={{ marginTop: 0 }}>
                  No active reward codes yet.
                </p>
              ) : (
                <div className="admin-chart-list">
                  {rewardCodes
                    .filter((code) => code.status === "active")
                    .slice(0, 6)
                    .map((code) => (
                      <div className="admin-reward-code-row" key={code.id}>
                        <strong>{code.code}</strong>
                        <span>{code.rewardLabel}</span>
                        <span className="footer-note">{code.guestName ?? code.emailKey ?? code.phoneKey}</span>
                      </div>
                    ))}
                </div>
              )}
            </article>

            <article className="card admin-chart-card">
              <div className="admin-chart-head">
                <h4>Recently redeemed</h4>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={actionKey !== null || rewardCodes.every((code) => code.status !== "used")}
                  onClick={() => void clearRedeemedRewardCodes()}
                >
                  {actionKey === "clear-redeemed-reward-codes" ? "Cleaning..." : "Clean redeemed"}
                </button>
              </div>
              {rewardCodes.filter((code) => code.status === "used").length === 0 ? (
                <p className="footer-note" style={{ marginTop: 0 }}>
                  No redeemed reward codes yet.
                </p>
              ) : (
                <div className="admin-chart-list">
                  {rewardCodes
                    .filter((code) => code.status === "used")
                    .slice(0, 6)
                    .map((code) => (
                      <div className="admin-reward-code-row" key={code.id}>
                        <strong>{code.code}</strong>
                        <span>{code.rewardLabel}</span>
                        <span className="footer-note">
                          {code.usedAt ? `Redeemed ${code.usedAt.slice(0, 10)}` : "Redeemed"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === "calendar" ? (
        <section className="card">
          <div className="admin-calendar-head">
            <h3 className="admin-calendar-head-title">Confirmed Calendar</h3>
            <div className="admin-calendar-controls">
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
              <button
                className="btn btn-secondary btn-icon"
                type="button"
                aria-label={selectedCalendarDate ? `Add reservation for ${selectedCalendarDate}` : "Select a day first"}
                title={selectedCalendarDate ? "Add reservation" : "Select a day first"}
                onClick={() => {
                  if (!selectedCalendarDate) {
                    setStatusMessage("Select a day in the calendar first.");
                    return;
                  }
                  setIsManualReservationFormOpen(true);
                }}
              >
                +
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
            ) : (
              <>
                <article className="card" style={{ padding: "0.9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: "0.3rem" }}>
                        Close reservation window
                      </h4>
                      <p className="footer-note" style={{ marginTop: 0 }}>
                        {selectedDayClosures.length > 0
                          ? `${selectedDayClosures.length} closed window${selectedDayClosures.length === 1 ? "" : "s"} for ${selectedCalendarDate}`
                          : `No closed windows for ${selectedCalendarDate}`}
                      </p>
                    </div>
                    <label
                      className="ios-switch-field"
                      style={{ marginBottom: 0, alignSelf: "center", fontWeight: 600 }}
                    >
                      <input
                        className="ios-switch-input"
                        type="checkbox"
                        checked={isClosureToolsOpen}
                        onChange={(event) => setIsClosureToolsOpen(event.target.checked)}
                      />
                      <span className="ios-switch" aria-hidden="true" />
                      Manage closed windows
                    </label>
                  </div>

                  {isClosureToolsOpen ? (
                    <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.8rem" }}>
                      <div className="form-grid">
                        <div>
                          <label>From</label>
                          <input
                            type="time"
                            value={closureForm.startTime}
                            onChange={(event) =>
                              setClosureForm((prev) => ({ ...prev, startTime: event.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label>Until</label>
                          <input
                            type="time"
                            value={closureForm.endTime}
                            onChange={(event) =>
                              setClosureForm((prev) => ({ ...prev, endTime: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label>Reason (optional)</label>
                        <input
                          value={closureForm.note}
                          placeholder="Private event, fully booked, etc."
                          onChange={(event) =>
                            setClosureForm((prev) => ({ ...prev, note: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={actionKey !== null}
                          onClick={createCalendarClosure}
                        >
                          {actionKey === "create-calendar-closure"
                            ? "Saving..."
                            : "Close reservation window"}
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {selectedDayClosures.length === 0 ? (
                          <p className="footer-note" style={{ marginTop: 0 }}>
                            No closure windows for this day.
                          </p>
                        ) : (
                          selectedDayClosures.map((closure) => (
                            <div
                              key={closure.id}
                              className="card"
                              style={{ padding: "0.7rem", display: "grid", gap: "0.35rem" }}
                            >
                              <strong>
                                {closure.startTime} - {closure.endTime}
                              </strong>
                              <p className="footer-note" style={{ marginTop: 0 }}>
                                {closure.note?.trim() || "Closed to new reservations in this window."}
                              </p>
                              <div>
                                <button
                                  className="btn btn-secondary"
                                  type="button"
                                  disabled={actionKey !== null}
                                  onClick={() => deleteCalendarClosure(closure.id)}
                                >
                                  {actionKey === `delete-closure-${closure.id}`
                                    ? "Removing..."
                                    : "Remove closure"}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>

                {selectedDayReservations.length === 0 ? (
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
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                          <span className="pill reservation-locale-chip">
                            {getMessageLanguageLabel(reservation)}
                          </span>
                          <span className="pill reservation-locale-chip">{reservation.version}</span>
                        </div>
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
                      {(() => {
                        const activeRewardCode = getActiveRewardCodeForReservation(reservation, rewardCodes);
                        return activeRewardCode ? (
                          <div className="card admin-reward-card">
                            <div className="admin-reward-head">
                              <strong>Guest reward</strong>
                              <span className="pill reservation-locale-chip">{activeRewardCode.status}</span>
                            </div>
                            <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                              <strong>{activeRewardCode.code}</strong> · {activeRewardCode.rewardLabel}
                            </p>
                            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                              <a
                                className="btn btn-secondary"
                                href={toRewardWhatsAppUrl(reservation.phone, activeRewardCode, reservation.locale)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Send reward WhatsApp
                              </a>
                              <a
                                className="btn btn-secondary"
                                href={toRewardEmailUrl(reservation.email, activeRewardCode, reservation.locale)}
                              >
                                Send reward email
                              </a>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      {hasReservationExtraDetails(reservation) ? (
                        <details className="reservation-extra-details">
                          <summary>More details</summary>
                          {reservation.version === "v1" ? (
                            <>
                              <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                                <strong>Occasion:</strong>{" "}
                                {reservation.occasion?.trim() ? reservation.occasion : "-"}
                              </p>
                              <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                                <strong>Special requests:</strong>{" "}
                                {reservation.notes?.trim() ? reservation.notes : "-"}
                              </p>
                            </>
                          ) : (
                            <p className="footer-note" style={{ marginTop: "0.45rem" }}>
                              <strong>Other information:</strong>{" "}
                              {reservation.notes?.trim() ? reservation.notes : "-"}
                            </p>
                          )}
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
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={actionKey !== null}
                          onClick={() => changeReservationStatus(reservation.id, "no_show")}
                        >
                          {actionKey === `reservation-${reservation.id}-no_show`
                            ? "Updating..."
                            : "No show"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </>
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
          <section className="card admin-realtime-settings-card">
            <div className="admin-chart-head">
              <h3>Realtime notifications</h3>
              <p className="footer-note admin-chart-subtitle">
                Card highlight is automatic. Sound is optional. Native browser notifications require permission.
              </p>
            </div>
            <div className="admin-realtime-settings-row">
              <label className="ios-switch-field" style={{ marginBottom: 0 }}>
                <input
                  className="ios-switch-input"
                  type="checkbox"
                  checked={adminRealtimeSettings.soundEnabled}
                  onChange={(event) => handleSoundAlertToggle(event.target.checked)}
                />
                <span className="ios-switch" aria-hidden="true" />
                <span>Sound alerts</span>
              </label>
              <div style={{ display: "grid", gap: "0.35rem", alignItems: "start" }}>
                <label className="ios-switch-field" style={{ marginBottom: 0 }}>
                  <input
                    className="ios-switch-input"
                    type="checkbox"
                    checked={adminRealtimeSettings.desktopEnabled}
                    onChange={(event) => {
                      void handleDesktopNotificationToggle(event.target.checked);
                    }}
                  />
                  <span className="ios-switch" aria-hidden="true" />
                  <span>Native browser notifications</span>
                </label>
              </div>
            </div>
            <div className="admin-manual-choice-section">
              <label>Notification theme</label>
              <div className="admin-manual-choice-grid admin-manual-choice-grid-theme">
                {adminNotificationThemeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`admin-manual-choice ${
                      adminRealtimeSettings.notificationTheme === option.value ? "active" : ""
                    }`}
                    onClick={() =>
                      setAdminRealtimeSettings((current) => ({
                        ...current,
                        notificationTheme: option.value,
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h3 style={{ marginBottom: "0.7rem" }}>Business Contact</h3>
            <p className="footer-note" style={{ marginTop: 0 }}>
              Used for the tutorial demo card and the homepage contact details so the owner can update it later.
            </p>
            <div className="form-grid" style={{ marginTop: "0.7rem" }}>
              <input
                placeholder="Business WhatsApp number"
                value={tutorialSettings.businessPhone}
                onChange={(event) =>
                  setTutorialSettings((prev) => ({ ...prev, businessPhone: event.target.value }))
                }
              />
              <input
                placeholder="Business email"
                type="email"
                value={tutorialSettings.businessEmail}
                onChange={(event) =>
                  setTutorialSettings((prev) => ({ ...prev, businessEmail: event.target.value }))
                }
              />
              <button
                className="btn btn-primary"
                type="button"
                disabled={actionKey !== null}
                onClick={saveTutorialSettingsConfiguration}
              >
                {actionKey === "save-tutorial-settings" ? "Saving..." : "Save business contact"}
              </button>
            </div>
          </section>

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

      {isManualReservationFormOpen && selectedCalendarDate ? (
        <>
          <button
            className="confirm-modal-backdrop"
            type="button"
            aria-label="Close add reservation modal"
            onClick={() => setIsManualReservationFormOpen(false)}
          />
          <div className="confirm-modal-wrap" onClick={() => setIsManualReservationFormOpen(false)}>
            <section
              className="confirm-modal-card admin-manual-reservation-modal"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
              style={{ width: "min(640px, calc(100vw - 2rem))", maxHeight: "90dvh", overflowY: "auto" }}
            >
              <h3>Add reservation</h3>
              <p className="footer-note" style={{ marginTop: "0.5rem" }}>
                Add a phone or walk-in booking directly to the confirmed calendar for{" "}
                {formatEuropeanDate(selectedCalendarDate)}.
              </p>

              <div className="admin-manual-reservation-form">
                <div className="admin-manual-choice-section">
                  <label>Language</label>
                  <div className="admin-manual-choice-grid admin-manual-choice-grid-tight admin-manual-choice-grid-language">
                    {manualReservationLocaleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`admin-manual-choice admin-manual-choice-language ${
                          manualReservationForm.locale === option.value ? "active" : ""
                        }`}
                        onClick={() =>
                          setManualReservationForm((prev) => ({
                            ...prev,
                            locale: option.value,
                          }))
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-manual-choice-section">
                  <label>Time</label>
                  <div className="admin-manual-choice-grid">
                    {manualReservationTimeOptions.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`admin-manual-choice ${manualReservationForm.time === time ? "active" : ""}`}
                        onClick={() => setManualReservationForm((prev) => ({ ...prev, time }))}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-manual-choice-section">
                  <label>Guests</label>
                  <div className="admin-manual-choice-grid admin-manual-choice-grid-tight">
                    {manualReservationGuestOptions.map((guests) => (
                      <button
                        key={guests}
                        type="button"
                        className={`admin-manual-choice ${manualReservationForm.guests === guests ? "active" : ""}`}
                        onClick={() => setManualReservationForm((prev) => ({ ...prev, guests }))}
                      >
                        {guests}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label>Full name</label>
                    <input
                      required
                      value={manualReservationForm.fullName}
                      onChange={(event) =>
                        setManualReservationForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                      placeholder="Guest full name"
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      value={manualReservationForm.phone}
                      onChange={(event) =>
                        setManualReservationForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      placeholder="+351..."
                    />
                  </div>
                  <div>
                    <label>Email (optional)</label>
                    <input
                      type="email"
                      value={manualReservationForm.email}
                      onChange={(event) =>
                        setManualReservationForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="guest@email.com"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Other information (optional)</label>
                    <textarea
                      value={manualReservationForm.otherInfo}
                      onChange={(event) =>
                        setManualReservationForm((prev) => ({ ...prev, otherInfo: event.target.value }))
                      }
                      placeholder="Notes, seating request, dietary info..."
                    />
                  </div>
                </div>

                <div className="confirm-modal-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => {
                      setManualReservationForm(defaultManualReservationForm);
                      setIsManualReservationFormOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => void createManualCalendarReservation()}
                  >
                    {actionKey === "create-manual-calendar-reservation" ? "Saving..." : "Add confirmed reservation"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}

    </div>
  );
}
