"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/types";

type WorkingHoursEntry = {
  id: string;
  weekday: number;
  isClosed: boolean;
};

type AvailabilityModalState = {
  title: string;
  message: string;
  variant: "full" | "closed";
} | null;

type SuccessReservationSummary = {
  fullName: string;
  date: string;
  time: string;
  guests: string;
  phone: string;
} | null;

type ReserveText = {
  title: string;
  subtitle: string;
  steps: [string, string, string, string];
  back: string;
  selectDate: string;
  selectTime: string;
  selectGuests: string;
  yourDetails: string;
  noSlots: string;
  loadingSlots: string;
  chooseDifferentDate: string;
  fullName: string;
  phone: string;
  email: string;
  emailHint: string;
  otherInfo: string;
  guestsLabel: string;
  send: string;
  sending: string;
  successTitle: string;
  successBody: string;
  successSummaryTitle: string;
  successNextTitle: string;
  successNextBody: string;
  summaryDate: string;
  summaryTime: string;
  summaryGuests: string;
  summaryName: string;
  summaryPhone: string;
  close: string;
  dayClosedTitle: string;
  dayClosedBody: string;
  fullTitle: string;
  fullBody: string;
  selectDateFirst: string;
  selectTimeFirst: string;
  requiredError: string;
  previousMonth: string;
  nextMonth: string;
  guestOne: string;
  nameError: string;
  phoneError: string;
  fullyBooked: string;
  slotTaken: string;
  stepsLabel: string;
};


const getTodayMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const dayFromIsoDate = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  ).getUTCDay();
};

const parseMonthKey = (value: string): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  return { year: Number(match[1]), month: Number(match[2]) };
};

const intlLocaleFor = (locale: Locale): string => (locale === "pt" ? "pt-PT" : "en-GB");

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const formatEuroDate = (value: string, locale: Locale): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)));
};

const texts = {
  en: {
    title: "Book a table",
    subtitle: "Pick a day, choose a time, then tell us who is coming.",
    steps: ["Date", "Time", "Guests", "Details"],
    stepsLabel: "Booking steps",
    back: "Back",
    selectDate: "Choose your date",
    selectTime: "Choose a time",
    selectGuests: "How many guests?",
    yourDetails: "Your details",
    noSlots: "No times are available on this date.",
    loadingSlots: "Loading available times…",
    chooseDifferentDate: "Choose a different day.",
    fullName: "Full name",
    phone: "Phone or WhatsApp",
    email: "Email",
    emailHint: "optional",
    otherInfo: "Anything we should know?",
    guestsLabel: "guests",
    guestOne: "guest",
    send: "Send reservation request",
    sending: "Sending…",
    successTitle: "Reservation sent",
    successBody: "Your reservation request was sent. We will contact you soon.",
    successSummaryTitle: "Your reservation",
    successNextTitle: "What happens next",
    successNextBody:
      "We will review your request and contact you soon on WhatsApp or by email to confirm the booking.",
    summaryDate: "Date",
    summaryTime: "Time",
    summaryGuests: "Guests",
    summaryName: "Name",
    summaryPhone: "Phone or WhatsApp",
    close: "Close",
    dayClosedTitle: "Closed that day",
    dayClosedBody: "We are closed on this day. Please choose another date.",
    fullTitle: "Sorry, we’re full",
    fullBody: "There are no available reservation times on that day.",
    selectDateFirst: "Pick a date first.",
    selectTimeFirst: "Pick a time first.",
    requiredError: "Please complete all required fields.",
    nameError: "Enter your full name.",
    phoneError: "Enter a phone or WhatsApp number so we can confirm your table.",
    fullyBooked: "Fully booked",
    slotTaken: "That time is no longer available. Please go back and choose another time.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
  },
  pt: {
    title: "Reservar mesa",
    subtitle: "Escolha o dia, a hora e diga-nos quem vem.",
    steps: ["Data", "Hora", "Pessoas", "Dados"],
    stepsLabel: "Passos da reserva",
    back: "Voltar",
    selectDate: "Escolha a data",
    selectTime: "Escolha a hora",
    selectGuests: "Quantas pessoas?",
    yourDetails: "Os seus dados",
    noSlots: "Não há horários disponíveis nesta data.",
    loadingSlots: "A carregar horários disponíveis…",
    chooseDifferentDate: "Escolha outro dia.",
    fullName: "Nome completo",
    phone: "Telefone ou WhatsApp",
    email: "Email",
    emailHint: "opcional",
    otherInfo: "Algo que devamos saber?",
    guestsLabel: "pessoas",
    guestOne: "pessoa",
    send: "Enviar pedido de reserva",
    sending: "A enviar…",
    successTitle: "Reserva enviada",
    successBody: "O seu pedido de reserva foi enviado. Vamos entrar em contacto em breve.",
    successSummaryTitle: "A sua reserva",
    successNextTitle: "O que acontece a seguir",
    successNextBody:
      "Vamos rever o seu pedido e entrar em contacto em breve por WhatsApp ou por email para confirmar a reserva.",
    summaryDate: "Data",
    summaryTime: "Hora",
    summaryGuests: "Pessoas",
    summaryName: "Nome",
    summaryPhone: "Telefone ou WhatsApp",
    close: "Fechar",
    dayClosedTitle: "Fechado nesse dia",
    dayClosedBody: "Estamos fechados neste dia. Escolha outra data.",
    fullTitle: "Desculpe, estamos lotados",
    fullBody: "Não há horários de reserva disponíveis nesse dia.",
    selectDateFirst: "Escolha primeiro uma data.",
    selectTimeFirst: "Escolha primeiro uma hora.",
    requiredError: "Preencha todos os campos obrigatórios.",
    nameError: "Indique o seu nome completo.",
    phoneError: "Indique um telefone ou WhatsApp para podermos confirmar a mesa.",
    fullyBooked: "Sem vagas neste dia",
    slotTaken: "Essa hora já não está disponível. Volte atrás e escolha outra hora.",
    previousMonth: "Mês anterior",
    nextMonth: "Mês seguinte",
  },
} satisfies Record<Locale, ReserveText>;

function ModalStatusIcon({ variant }: { variant: "full" | "closed" }) {
  return (
    <motion.div
      className={`reservation-modal-icon reservation-modal-icon-${variant}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="reservation-modal-icon-ring" cx="32" cy="32" r="28" />
        <path
          className="reservation-modal-icon-mark"
          d="M32 19v18"
          fill="none"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <circle className="reservation-modal-icon-dot" cx="32" cy="45" r="3" />
      </svg>
    </motion.div>
  );
}

export default function ReserveFlow() {
  const localeValue = useLocale();
  const locale = localeValue as Locale;
  const t = texts[locale];
  const [calendarMonth, setCalendarMonth] = useState(getTodayMonthKey);
  const [currentStep, setCurrentStep] = useState(1);
  const [workingHours, setWorkingHours] = useState<WorkingHoursEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dailyAvailability, setDailyAvailability] = useState<Record<string, boolean>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedGuests, setSelectedGuests] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [message, setMessage] = useState("");
  const [availabilityModal, setAvailabilityModal] = useState<AvailabilityModalState>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successSummary, setSuccessSummary] = useState<SuccessReservationSummary>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: false, phone: false });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const calendarMonthDate = useMemo(() => {
    const parsed = parseMonthKey(calendarMonth);
    if (!parsed) {
      return new Date();
    }
    return new Date(parsed.year, parsed.month - 1, 1);
  }, [calendarMonth]);
  const monthLabel = capitalize(
    new Intl.DateTimeFormat(intlLocaleFor(locale), { month: "long", year: "numeric" }).format(
      calendarMonthDate,
    ),
  );
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        capitalize(
          new Intl.DateTimeFormat(intlLocaleFor(locale), { weekday: "long", timeZone: "UTC" })
            .format(new Date(Date.UTC(2024, 0, 1 + index, 12)))
            .slice(0, 3),
        ),
      ),
    [locale],
  );
  const reduceMotion = useReducedMotion();
  const progressPercent = (currentStep / t.steps.length) * 100;
  const tacoPercent = Math.min(progressPercent, 94);
  const guestWord = (count: string) => (count === "1" ? t.guestOne : t.guestsLabel);

  useEffect(() => {
    if (!availabilityModal && !isSuccessModalOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvailabilityModal(null);
        setIsSuccessModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [availabilityModal, isSuccessModalOpen]);

  useEffect(() => {
    let active = true;
    const loadWorkingHours = async () => {
      try {
        const response = await fetch("/api/working-hours", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const json = (await response.json()) as { data?: WorkingHoursEntry[] };
        if (active) {
          setWorkingHours(json.data ?? []);
        }
      } catch {
        // Leave page usable with fallback date selection.
      }
    };
    void loadWorkingHours();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadMonthAvailability = async () => {
      try {
        const response = await fetch(`/api/reservations/availability?month=${calendarMonth}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as { data?: Record<string, boolean> };
        if (!active) {
          return;
        }

        setDailyAvailability(json.data ?? {});
      } catch {
        if (active) {
          setDailyAvailability({});
        }
      }
    };

    void loadMonthAvailability();
    return () => {
      active = false;
    };
  }, [calendarMonth]);

  const calendarCells = useMemo(() => {
    const startWeekdayMondayFirst = (calendarMonthDate.getDay() + 6) % 7;
    const daysInMonth = new Date(
      calendarMonthDate.getFullYear(),
      calendarMonthDate.getMonth() + 1,
      0,
    ).getDate();
    const cells: Array<{ isoDate: string | null; day: number | null }> = [];
    for (let index = 0; index < startWeekdayMondayFirst; index += 1) {
      cells.push({ isoDate: null, day: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isoDate = `${calendarMonthDate.getFullYear()}-${String(
        calendarMonthDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ isoDate, day });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ isoDate: null, day: null });
    }
    return cells;
  }, [calendarMonthDate]);

  const guestOptions = ["1", "2", "3", "4", "5", "6+"];

  const loadAvailability = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setAvailableSlots([]);
    setIsLoadingSlots(true);

    try {
      const response = await fetch(`/api/reservations/availability?date=${date}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as { data?: string[] };
      const slots = json.data ?? [];
      setAvailableSlots(slots);

      if (slots.length === 0) {
        setCurrentStep(1);
        const weekday = dayFromIsoDate(date);
        const dayHours =
          weekday === null ? null : workingHours.find((entry) => entry.weekday === weekday);
        setAvailabilityModal({
          title: dayHours?.isClosed ? t.dayClosedTitle : t.fullTitle,
          message: dayHours?.isClosed ? t.dayClosedBody : t.fullBody,
          variant: dayHours?.isClosed ? "closed" : "full",
        });
      } else {
        setCurrentStep(2);
      }
    } catch {
      setCurrentStep(1);
      setAvailabilityModal({
        title: t.fullTitle,
        message: t.fullBody,
        variant: "full",
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const submitReservation = async () => {
    if (!selectedDate) {
      setMessage(t.selectDateFirst);
      return;
    }
    if (!selectedTime) {
      setMessage(t.selectTimeFirst);
      return;
    }
    const nameMissing = !fullName.trim();
    const phoneMissing = !phone.trim();
    if (nameMissing || phoneMissing) {
      setFieldErrors({ name: nameMissing, phone: phoneMissing });
      setMessage("");
      (nameMissing ? nameInputRef : phoneInputRef).current?.focus();
      return;
    }
    if (!selectedGuests) {
      setMessage(t.requiredError);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          fullName,
          phone,
          email,
          date: selectedDate,
          time: selectedTime,
          guests: selectedGuests,
          otherInfo,
        }),
      });

      const json = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) {
        if (json.code === "slot_unavailable") {
          setAvailabilityModal({
            title: t.fullTitle,
            message: t.slotTaken,
            variant: "full",
          });
        } else {
          setMessage(json.error ?? t.requiredError);
        }
        return;
      }

      setSuccessSummary({
        fullName: fullName.trim(),
        date: selectedDate,
        time: selectedTime,
        guests: selectedGuests,
        phone: phone.trim(),
      });
      setSelectedDate("");
      setAvailableSlots([]);
      setSelectedTime("");
      setSelectedGuests("");
      setFullName("");
      setPhone("");
      setEmail("");
      setOtherInfo("");
      setMessage("");
      setFieldErrors({ name: false, phone: false });
      setCurrentStep(1);
      setIsSuccessModalOpen(true);
    } catch {
      setMessage(t.requiredError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="site-shell reserve-page">
      <div className="reserve-band full-bleed">
        <div className="reserve-page-inner">
      <div className="reserve-intro">
        <h1>{t.title}</h1>
        <p className="reserve-subtitle">{t.subtitle}</p>
        <div
          className="reserve-progress"
          role="progressbar"
          aria-label={t.stepsLabel}
          aria-valuemin={1}
          aria-valuemax={t.steps.length}
          aria-valuenow={currentStep}
          aria-valuetext={`${currentStep} / ${t.steps.length}`}
        >
          <div className="reserve-progress-track">
            <motion.div
              className="reserve-progress-fill"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />
            <motion.div
              className="reserve-progress-taco"
              initial={false}
              animate={{ left: `calc(${tacoPercent}% - 20px)` }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <motion.span
                aria-hidden="true"
                animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [-4, 4, -4] }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                🌮
              </motion.span>
            </motion.div>
          </div>
        </div>
        <ol className="reserve-steps" aria-label={t.stepsLabel}>
          {t.steps.map((step, index) => {
            const number = index + 1;
            const state =
              currentStep === number ? "current" : currentStep > number ? "done" : "todo";
            return (
              <li
                key={step}
                className={`reserve-step ${state}`}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className="reserve-step-num" aria-hidden="true">
                  {number}
                </span>
                <span className="reserve-step-label">{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="reserve-panel-wrap">
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.section
              key="reserve-step-1"
              className="reserve-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="reserve-calendar-head">
                <h2>{t.selectDate}</h2>
                <div className="reserve-month-nav">
                  <button
                    className="btn btn-secondary reserve-month-btn"
                    type="button"
                    aria-label={t.previousMonth}
                    onClick={() => {
                      const prev = new Date(
                        calendarMonthDate.getFullYear(),
                        calendarMonthDate.getMonth() - 1,
                        1,
                      );
                      setCalendarMonth(
                        `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
                      );
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path
                        d="M15.5 5l-7 7 7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    className="btn btn-secondary reserve-month-btn"
                    type="button"
                    aria-label={t.nextMonth}
                    onClick={() => {
                      const next = new Date(
                        calendarMonthDate.getFullYear(),
                        calendarMonthDate.getMonth() + 1,
                        1,
                      );
                      setCalendarMonth(
                        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
                      );
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path
                        d="M8.5 5l7 7-7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="reserve-month-label" aria-live="polite">
                {monthLabel}
              </p>
              <div className="reserve-calendar-grid">
                {weekdayLabels.map((weekday) => (
                  <div key={weekday} className="reserve-calendar-weekday">
                    {weekday}
                  </div>
                ))}
                {calendarCells.map((cell, index) => {
                  if (!cell.isoDate || !cell.day) {
                    return <div key={`empty-${index}`} className="reserve-calendar-empty" />;
                  }
                  const isoDate = cell.isoDate;
                  const weekday = dayFromIsoDate(isoDate);
                  const dayHours =
                    weekday === null
                      ? null
                      : workingHours.find((entry) => entry.weekday === weekday);
                  const isPast = isoDate < todayIso;
                  const isFullDayUnavailable =
                    Object.prototype.hasOwnProperty.call(dailyAvailability, isoDate) &&
                    dailyAvailability[isoDate] === false;
                  const isDisabled =
                    isPast || Boolean(dayHours?.isClosed) || isFullDayUnavailable;
                  const classNames = [
                    "reserve-calendar-day",
                    selectedDate === isoDate ? "active" : "",
                    isoDate === todayIso ? "today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      className={classNames}
                      disabled={isDisabled}
                      aria-pressed={selectedDate === isoDate}
                      aria-label={
                        isFullDayUnavailable ? `${cell.day}, ${t.fullyBooked}` : undefined
                      }
                      onClick={() => void loadAvailability(isoDate)}
                      title={isFullDayUnavailable ? t.fullyBooked : undefined}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          ) : null}

          {currentStep === 2 ? (
            <motion.section
              key="reserve-step-2"
              className="reserve-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="reserve-panel-head">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setCurrentStep(1)}
                >
                  {t.back}
                </button>
                <h2>{t.selectTime}</h2>
              </div>
              {!selectedDate ? (
                <p className="reserve-note">{t.selectDateFirst}</p>
              ) : isLoadingSlots ? (
                <p className="reserve-note" aria-live="polite">
                  {t.loadingSlots}
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="reserve-note">
                  {t.noSlots} {t.chooseDifferentDate}
                </p>
              ) : (
                <div className="reserve-options">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`btn btn-secondary reserve-option${selectedTime === slot ? " selected" : ""}`}
                      aria-pressed={selectedTime === slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setCurrentStep(3);
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </motion.section>
          ) : null}

          {currentStep === 3 ? (
            <motion.section
              key="reserve-step-3"
              className="reserve-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="reserve-panel-head">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                >
                  {t.back}
                </button>
                <h2>{t.selectGuests}</h2>
              </div>
              <div className="reserve-options">
                {guestOptions.map((guest) => (
                  <button
                    key={guest}
                    type="button"
                    className={`btn btn-secondary reserve-option${selectedGuests === guest ? " selected" : ""}`}
                    aria-pressed={selectedGuests === guest}
                    onClick={() => {
                      setSelectedGuests(guest);
                      setCurrentStep(4);
                    }}
                  >
                    {guest} {guestWord(guest)}
                  </button>
                ))}
              </div>
            </motion.section>
          ) : null}

          {currentStep === 4 ? (
            <motion.section
              key="reserve-step-4"
              className="reserve-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="reserve-panel-head">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setCurrentStep(3)}
                >
                  {t.back}
                </button>
                <h2>{t.yourDetails}</h2>
              </div>
              <dl className="reserve-summary">
                <div>
                  <dt>{t.summaryDate}</dt>
                  <dd>{selectedDate ? formatEuroDate(selectedDate, locale) : "-"}</dd>
                </div>
                <div>
                  <dt>{t.summaryTime}</dt>
                  <dd>{selectedTime || "-"}</dd>
                </div>
                <div>
                  <dt>{t.summaryGuests}</dt>
                  <dd>
                    {selectedGuests || "-"} {guestWord(selectedGuests)}
                  </dd>
                </div>
              </dl>
              <div className="reserve-fields">
                <div className="reserve-field">
                  <label htmlFor="reserve-name">{t.fullName}</label>
                  <input
                    id="reserve-name"
                    name="name"
                    ref={nameInputRef}
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "reserve-name-error" : undefined}
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, name: false }));
                    }}
                  />
                  {fieldErrors.name ? (
                    <p id="reserve-name-error" className="reserve-field-error">
                      {t.nameError}
                    </p>
                  ) : null}
                </div>
                <div className="reserve-field">
                  <label htmlFor="reserve-phone">{t.phone}</label>
                  <input
                    id="reserve-phone"
                    name="phone"
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={fieldErrors.phone}
                    aria-describedby={fieldErrors.phone ? "reserve-phone-error" : undefined}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, phone: false }));
                    }}
                  />
                  {fieldErrors.phone ? (
                    <p id="reserve-phone-error" className="reserve-field-error">
                      {t.phoneError}
                    </p>
                  ) : null}
                </div>
                <div className="reserve-field">
                  <label htmlFor="reserve-email">
                    {t.email} <span className="reserve-hint">({t.emailHint})</span>
                  </label>
                  <input
                    id="reserve-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="reserve-field">
                  <label htmlFor="reserve-other">{t.otherInfo}</label>
                  <textarea
                    id="reserve-other"
                    name="notes"
                    value={otherInfo}
                    onChange={(event) => setOtherInfo(event.target.value)}
                  />
                </div>
              </div>
              <div className="reserve-submit-row">
                <button
                  className="btn btn-primary reserve-submit-btn"
                  type="button"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  onClick={submitReservation}
                >
                  {isSubmitting ? t.sending : t.send}
                </button>
                {message ? (
                  <p className="reserve-message" role="alert">
                    {message}
                  </p>
                ) : null}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
        </div>
      </div>

      <AnimatePresence>
        {availabilityModal ? (
          <>
            <motion.button
              className="confirm-modal-backdrop reserve-backdrop"
              type="button"
              aria-label={t.close}
              onClick={() => setAvailabilityModal(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="confirm-modal-wrap" onClick={() => setAvailabilityModal(null)}>
              <motion.section
                className="confirm-modal-card reserve-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reserve-availability-title"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
              >
                <ModalStatusIcon variant={availabilityModal.variant} />
                <h2 id="reserve-availability-title">{availabilityModal.title}</h2>
                <p className="reserve-note">{availabilityModal.message}</p>
                <div className="confirm-modal-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setAvailabilityModal(null)}
                  >
                    {t.close}
                  </button>
                </div>
              </motion.section>
            </div>
          </>
        ) : null}

        {isSuccessModalOpen ? (
          <>
            <motion.button
              className="confirm-modal-backdrop reserve-backdrop"
              type="button"
              aria-label={t.close}
              onClick={() => setIsSuccessModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="confirm-modal-wrap" onClick={() => setIsSuccessModalOpen(false)}>
              <motion.section
                className="confirm-modal-card reserve-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reserve-success-title"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
              >
                <Image
                  className="reservation-modal-mascot"
                  src="/mascot_logo.webp"
                  alt=""
                  width={84}
                  height={84}
                />
                <h2 id="reserve-success-title">{t.successTitle}</h2>
                <p className="reserve-note">{t.successBody}</p>
                {successSummary ? (
                  <>
                    <div className="reserve-success-block">
                      <h3>{t.successSummaryTitle}</h3>
                      <dl className="reserve-summary">
                        <div>
                          <dt>{t.summaryDate}</dt>
                          <dd>{formatEuroDate(successSummary.date, locale)}</dd>
                        </div>
                        <div>
                          <dt>{t.summaryTime}</dt>
                          <dd>{successSummary.time}</dd>
                        </div>
                        <div>
                          <dt>{t.summaryGuests}</dt>
                          <dd>
                            {successSummary.guests} {guestWord(successSummary.guests)}
                          </dd>
                        </div>
                        <div>
                          <dt>{t.summaryName}</dt>
                          <dd>{successSummary.fullName}</dd>
                        </div>
                        <div>
                          <dt>{t.summaryPhone}</dt>
                          <dd>{successSummary.phone}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="reserve-success-block">
                      <h3>{t.successNextTitle}</h3>
                      <p className="reserve-note">{t.successNextBody}</p>
                    </div>
                  </>
                ) : null}
                <div className="confirm-modal-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setIsSuccessModalOpen(false)}
                  >
                    {t.close}
                  </button>
                </div>
              </motion.section>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
