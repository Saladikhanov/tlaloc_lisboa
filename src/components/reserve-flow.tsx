"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
};

type StepIconName = "date" | "time" | "guests" | "details";

const weekdayShortMondayFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdayShortMondayFirstPt = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const monthNamesEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const monthNamesPt = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

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

const formatEuroDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const texts = {
  en: {
    title: "Reservation",
    subtitle: "Pick a day, choose a slot, then finish your details.",
    steps: ["Date", "Time slot", "Guests", "Details"],
    back: "Back",
    selectDate: "1. Choose your date",
    selectTime: "2. Choose a time slot",
    selectGuests: "3. How many guests?",
    yourDetails: "4. Your details",
    noSlots: "No slots available for this date.",
    loadingSlots: "Loading available slots...",
    chooseDifferentDate: "Choose a different day.",
    fullName: "Full name *",
    phone: "Phone / WhatsApp *",
    email: "Email",
    emailHint: "Optional",
    otherInfo: "Other information",
    guestsLabel: "guests",
    send: "Send reservation request",
    sending: "Sending...",
    successTitle: "Reservation Sent",
    successBody: "Your reservation request was sent. We will contact you soon.",
    successSummaryTitle: "Reservation summary",
    successNextTitle: "What happens next",
    successNextBody:
      "We will review your request and contact you soon on WhatsApp or by email to confirm the booking.",
    summaryDate: "Date",
    summaryTime: "Time",
    summaryGuests: "Guests",
    summaryName: "Name",
    summaryPhone: "Phone / WhatsApp",
    close: "Close",
    dayClosedTitle: "Day closed",
    dayClosedBody: "This day is closed. Please choose another date.",
    fullTitle: "Sorry, we're full",
    fullBody: "There are no available reservation slots on that day.",
    selectDateFirst: "Pick a date first.",
    selectTimeFirst: "Pick a time slot first.",
    requiredError: "Please complete all required fields.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
  },
  pt: {
    title: "Reserva",
    subtitle: "Escolha a data, selecione o horario e depois complete os seus dados.",
    steps: ["Data", "Horario", "Pessoas", "Dados"],
    back: "Voltar",
    selectDate: "1. Escolha a data",
    selectTime: "2. Escolha o horario",
    selectGuests: "3. Quantas pessoas?",
    yourDetails: "4. Os seus dados",
    noSlots: "Nao ha horarios disponiveis para esta data.",
    loadingSlots: "A carregar horarios disponiveis...",
    chooseDifferentDate: "Escolha outro dia.",
    fullName: "Nome completo *",
    phone: "Telefone / WhatsApp *",
    email: "Email",
    emailHint: "Opcional",
    otherInfo: "Outras informacoes",
    guestsLabel: "pessoas",
    send: "Enviar pedido de reserva",
    sending: "A enviar...",
    successTitle: "Reserva enviada",
    successBody: "O seu pedido de reserva foi enviado. Vamos entrar em contacto em breve.",
    successSummaryTitle: "Resumo da reserva",
    successNextTitle: "O que acontece a seguir",
    successNextBody:
      "Vamos rever o seu pedido e entrar em contacto em breve por WhatsApp ou por email para confirmar a reserva.",
    summaryDate: "Data",
    summaryTime: "Hora",
    summaryGuests: "Pessoas",
    summaryName: "Nome",
    summaryPhone: "Telefone / WhatsApp",
    close: "Fechar",
    dayClosedTitle: "Dia fechado",
    dayClosedBody: "Este dia esta fechado. Escolha outra data.",
    fullTitle: "Desculpe, estamos lotados",
    fullBody: "Nao ha horarios de reserva disponiveis nesse dia.",
    selectDateFirst: "Escolha primeiro uma data.",
    selectTimeFirst: "Escolha primeiro um horario.",
    requiredError: "Preencha todos os campos obrigatorios.",
    previousMonth: "Mes anterior",
    nextMonth: "Mes seguinte",
  },
} satisfies Record<Locale, ReserveText>;

const stepIcons: StepIconName[] = ["date", "time", "guests", "details"];

function ModalStatusIcon({ variant }: { variant: "success" | "full" | "closed" }) {
  const isSuccess = variant === "success";

  return (
    <motion.div
      className={`reservation-modal-icon reservation-modal-icon-${variant}`}
      initial={{ scale: 0.82, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="reservation-modal-icon-glow"
        animate={{ scale: [1, 1.08, 1], opacity: [0.28, 0.5, 0.28] }}
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="reservation-modal-icon-ring" cx="32" cy="32" r="26" />
        {isSuccess ? (
          <motion.path
            className="reservation-modal-icon-mark"
            d="M20 33.5 L28 41.5 L44.5 24.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.38, delay: 0.12, ease: "easeOut" }}
          />
        ) : (
          <>
            <motion.path
              className="reservation-modal-icon-mark"
              d="M32 20v15"
              fill="none"
              strokeLinecap="round"
              strokeWidth="5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, delay: 0.1, ease: "easeOut" }}
            />
            <motion.circle
              className="reservation-modal-icon-dot"
              cx="32"
              cy="41.5"
              r="2.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22, delay: 0.32, ease: "easeOut" }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}

function StepIcon({ name }: { name: StepIconName }) {
  if (name === "date") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "time") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 8v4l3 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "guests") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm8 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 18a4.5 4.5 0 0 1 9 0M12 18a4 4 0 0 1 8 0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 6h8M8 10h8M8 14h5M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function ReserveFlow() {
  const localeValue = useLocale();
  const locale = localeValue as Locale;
  const isPortuguese = locale === "pt";
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

  const todayIso = new Date().toISOString().slice(0, 10);
  const calendarMonthDate = useMemo(() => {
    const parsed = parseMonthKey(calendarMonth);
    if (!parsed) {
      return new Date();
    }
    return new Date(parsed.year, parsed.month - 1, 1);
  }, [calendarMonth]);
  const monthLabel = `${(isPortuguese ? monthNamesPt : monthNamesEn)[calendarMonthDate.getMonth()]} ${calendarMonthDate.getFullYear()}`;
  const progressPercent = (currentStep / t.steps.length) * 100;
  const tacoProgressPercent = Math.min(progressPercent, 96);

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
    if (!selectedGuests || !fullName.trim() || !phone.trim()) {
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
            message: json.error ?? t.fullBody,
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
      setCurrentStep(1);
      setIsSuccessModalOpen(true);
    } catch {
      setMessage(t.requiredError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="site-shell form-shell">
      <h1>{t.title}</h1>
      <p className="footer-note">{t.subtitle}</p>

      <div className="reserve-flow-progress">
        <div className="reserve-flow-progress-track">
          <motion.div
            className="reserve-flow-progress-fill"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          />
          <motion.div
            className="reserve-flow-progress-icon"
            initial={false}
            animate={{ left: `calc(${tacoProgressPercent}% - 18px)` }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.span
              className="reserve-flow-progress-icon-glyph"
              animate={{ y: [0, -3, 0], rotate: [-4, 4, -4] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              🌮
            </motion.span>
          </motion.div>
        </div>
      </div>

      <div className="reserve-flow-steps">
        {t.steps.map((step, index) => (
          <span
            key={step}
            className={`quick-chip reserve-flow-step-chip ${currentStep === index + 1 ? "active" : ""}`}
            title={step}
            aria-label={step}
          >
            <span className="reserve-flow-step-icon" aria-hidden="true">
              <StepIcon name={stepIcons[index]} />
            </span>
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          <motion.section
            key="reserve-step-1"
            className="card reserve-flow-card reserve-flow-step-panel"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="admin-calendar-head">
              <h3>{t.selectDate}</h3>
              <div style={{ display: "flex", gap: "0.45rem" }}>
                <button
                  className="btn btn-secondary"
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
                  {"<"}
                </button>
                <button
                  className="btn btn-secondary"
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
                  {">"}
                </button>
              </div>
            </div>
            <p className="footer-note">{monthLabel}</p>
            <div className="reserve-flow-calendar-grid">
              {(isPortuguese ? weekdayShortMondayFirstPt : weekdayShortMondayFirst).map((weekday) => (
                <div key={weekday} className="reserve-flow-calendar-weekday">
                  {weekday}
                </div>
              ))}
              {calendarCells.map((cell, index) => {
                if (!cell.isoDate || !cell.day) {
                  return <div key={`empty-${index}`} className="reserve-flow-calendar-empty" />;
                }
                const isoDate = cell.isoDate;
                const weekday = dayFromIsoDate(isoDate);
                const dayHours =
                  weekday === null ? null : workingHours.find((entry) => entry.weekday === weekday);
                const isPast = isoDate < todayIso;
                const isFullDayUnavailable =
                  Object.prototype.hasOwnProperty.call(dailyAvailability, isoDate) &&
                  dailyAvailability[isoDate] === false;
                const isDisabled = isPast || Boolean(dayHours?.isClosed) || isFullDayUnavailable;

                return (
                  <button
                    key={isoDate}
                    type="button"
                    className={`reserve-flow-calendar-day ${selectedDate === isoDate ? "active" : ""}`}
                    disabled={isDisabled}
                    onClick={() => void loadAvailability(isoDate)}
                    title={
                      isFullDayUnavailable
                        ? isPortuguese
                          ? "Sem vagas neste dia"
                          : "Fully booked"
                        : undefined
                    }
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
            className="card reserve-flow-card reserve-flow-step-panel"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="reserve-flow-nav">
              <button className="btn btn-secondary" type="button" onClick={() => setCurrentStep(1)}>
                {t.back}
              </button>
            </div>
            <h3>{t.selectTime}</h3>
            {!selectedDate ? (
              <p className="footer-note">{t.selectDateFirst}</p>
            ) : isLoadingSlots ? (
              <p className="footer-note">{t.loadingSlots}</p>
            ) : availableSlots.length === 0 ? (
              <p className="footer-note">
                {t.noSlots} {t.chooseDifferentDate}
              </p>
            ) : (
              <div className="reserve-flow-option-grid">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn ${selectedTime === slot ? "btn-primary" : "btn-secondary"}`}
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
            className="card reserve-flow-card reserve-flow-step-panel"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="reserve-flow-nav">
              <button className="btn btn-secondary" type="button" onClick={() => setCurrentStep(2)}>
                {t.back}
              </button>
            </div>
            <h3>{t.selectGuests}</h3>
            <div className="reserve-flow-option-grid">
              {guestOptions.map((guest) => (
                <button
                  key={guest}
                  type="button"
                  className={`btn ${selectedGuests === guest ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setSelectedGuests(guest);
                    setCurrentStep(4);
                  }}
                >
                  {guest} {t.guestsLabel}
                </button>
              ))}
            </div>
          </motion.section>
        ) : null}

        {currentStep === 4 ? (
          <motion.section
            key="reserve-step-4"
            className="card reserve-flow-card reserve-flow-step-panel"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="reserve-flow-nav">
              <button className="btn btn-secondary" type="button" onClick={() => setCurrentStep(3)}>
                {t.back}
              </button>
            </div>
            <h3>{t.yourDetails}</h3>
            <div className="reserve-flow-summary footer-note">
              <span>{selectedDate ? formatEuroDate(selectedDate) : "-"}</span>
              <span>{selectedTime || "-"}</span>
              <span>
                {selectedGuests || "-"} {t.guestsLabel}
              </span>
            </div>
            <div className="form-grid" style={{ marginTop: "0.8rem" }}>
              <div>
                <label htmlFor="reserve-name">{t.fullName}</label>
                <input id="reserve-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div>
                <label htmlFor="reserve-phone">{t.phone}</label>
                <input
                  id="reserve-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: "0.8rem" }}>
              <div>
                <label htmlFor="reserve-email">
                  {t.email} <span className="footer-note">({t.emailHint})</span>
                </label>
                <input
                  id="reserve-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="reserve-other">{t.otherInfo}</label>
                <textarea
                  id="reserve-other"
                  value={otherInfo}
                  onChange={(event) => setOtherInfo(event.target.value)}
                />
              </div>
            </div>
            <div className="reserve-submit-row">
              <button className="btn btn-primary reserve-submit-btn" type="button" onClick={submitReservation}>
                {isSubmitting ? t.sending : t.send}
              </button>
              {message ? <span className="footer-note">{message}</span> : null}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {availabilityModal ? (
          <>
            <motion.button
              className="confirm-modal-backdrop"
              type="button"
              aria-label={t.close}
              onClick={() => setAvailabilityModal(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="confirm-modal-wrap" onClick={() => setAvailabilityModal(null)}>
              <motion.section
                className="confirm-modal-card"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
              >
                <ModalStatusIcon variant={availabilityModal.variant} />
                <h3>{availabilityModal.title}</h3>
                <p className="footer-note">{availabilityModal.message}</p>
                <div className="confirm-modal-actions">
                  <button className="btn btn-primary" type="button" onClick={() => setAvailabilityModal(null)}>
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
              className="confirm-modal-backdrop"
              type="button"
              aria-label={t.close}
              onClick={() => setIsSuccessModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="confirm-modal-wrap" onClick={() => setIsSuccessModalOpen(false)}>
              <motion.section
                className="confirm-modal-card"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
              >
                <ModalStatusIcon variant="success" />
                <h3>{t.successTitle}</h3>
                <p className="footer-note">{t.successBody}</p>
                {successSummary ? (
                  <>
                    <div className="reserve-flow-success-block">
                      <strong>{t.successSummaryTitle}</strong>
                      <div className="reserve-flow-success-grid">
                        <p className="footer-note">
                          <strong>{t.summaryDate}:</strong> {formatEuroDate(successSummary.date)}
                        </p>
                        <p className="footer-note">
                          <strong>{t.summaryTime}:</strong> {successSummary.time}
                        </p>
                        <p className="footer-note">
                          <strong>{t.summaryGuests}:</strong> {successSummary.guests}
                        </p>
                        <p className="footer-note">
                          <strong>{t.summaryName}:</strong> {successSummary.fullName}
                        </p>
                        <p className="footer-note">
                          <strong>{t.summaryPhone}:</strong> {successSummary.phone}
                        </p>
                      </div>
                    </div>
                    <div className="reserve-flow-success-block">
                      <strong>{t.successNextTitle}</strong>
                      <p className="footer-note" style={{ marginTop: "0.3rem" }}>
                        {t.successNextBody}
                      </p>
                    </div>
                  </>
                ) : null}
                <div className="confirm-modal-actions">
                  <button className="btn btn-primary" type="button" onClick={() => setIsSuccessModalOpen(false)}>
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
