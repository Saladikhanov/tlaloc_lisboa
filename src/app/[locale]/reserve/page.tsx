"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import PublicNav from "@/components/public-nav";
import type { Locale } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";
type WorkingHoursEntry = {
  id: string;
  weekday: number;
  isClosed: boolean;
  lunchOpen: string | null;
  lunchClose: string | null;
  dinnerOpen: string | null;
  dinnerClose: string | null;
};

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTimeLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

const dayFromIsoDate = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
};

function ReservePageContent() {
  const localeValue = useLocale();
  const locale = localeValue as Locale;
  const isPortuguese = localeValue.toLowerCase().startsWith("pt");
  const searchParams = useSearchParams();
  const t = useTranslations("ReservePage");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [workingHoursErrorModalMessage, setWorkingHoursErrorModalMessage] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const confirm = searchParams.get("confirm");
  const confirmFeedback = useMemo(() => {
    if (confirm === "success") {
      return { status: "success" as Status, message: t("confirmSuccess") };
    }

    if (confirm === "invalid") {
      return { status: "error" as Status, message: t("confirmInvalid") };
    }

    if (confirm === "error") {
      return { status: "error" as Status, message: t("confirmError") };
    }

    return null;
  }, [confirm, t]);

  const effectiveMessage = message || confirmFeedback?.message || "";
  const selectedWeekday = dayFromIsoDate(selectedDate);
  const selectedDayHours =
    selectedWeekday === null ? null : workingHours.find((entry) => entry.weekday === selectedWeekday);
  const availableTimeOptions = useMemo(() => {
    if (!selectedDayHours || selectedDayHours.isClosed) {
      return [];
    }

    const slotStepMinutes = 30;
    const shifts: Array<[string | null, string | null]> = [
      [selectedDayHours.lunchOpen, selectedDayHours.lunchClose],
      [selectedDayHours.dinnerOpen, selectedDayHours.dinnerClose],
    ];
    const options: string[] = [];

    for (const [open, close] of shifts) {
      if (!open || !close) {
        continue;
      }

      const openMinutes = toMinutes(open);
      const closeMinutes = toMinutes(close);
      if (openMinutes >= closeMinutes) {
        continue;
      }

      for (let value = openMinutes; value < closeMinutes; value += slotStepMinutes) {
        options.push(toTimeLabel(value));
      }
    }

    return options;
  }, [selectedDayHours]);
  const isTimeSelectionDisabled = !selectedDate || availableTimeOptions.length === 0;
  const safeSelectedTime = availableTimeOptions.includes(selectedTime) ? selectedTime : "";
  const todayIso = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;

    const loadWorkingHours = async () => {
      try {
        const response = await fetch("/api/working-hours", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as { data?: WorkingHoursEntry[] };
        if (active && json.data) {
          setWorkingHours(json.data);
        }
      } catch {
        // Keep reservation form usable even if schedule fetch fails.
      }
    };

    void loadWorkingHours();
    return () => {
      active = false;
    };
  }, []);

  function onDateChange(nextDate: string) {
    if (!nextDate) {
      setSelectedDate("");
      setSelectedTime("");
      return;
    }

    const weekday = dayFromIsoDate(nextDate);
    const dayHours = weekday === null ? null : workingHours.find((entry) => entry.weekday === weekday);
    if (dayHours?.isClosed) {
      setSelectedDate("");
      setSelectedTime("");
      setWorkingHoursErrorModalMessage(
        isPortuguese
          ? "Dia fechado. Escolha uma data dentro dos dias de funcionamento."
          : "This day is closed. Please choose a working day.",
      );
      return;
    }

    setSelectedDate(nextDate);
    setSelectedTime("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      locale,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      date: selectedDate,
      time: safeSelectedTime,
      guests: formData.get("guests"),
      occasion: formData.get("occasion"),
      notes: formData.get("notes"),
    };

    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      message?: string;
      error?: string;
      code?: string;
    };

    if (!response.ok) {
      if (json.code === "outside_working_hours") {
        setStatus("idle");
        setWorkingHoursErrorModalMessage(json.error ?? t("error"));
        return;
      }

      setStatus("error");
      setMessage(json.error ?? t("error"));
      return;
    }

    form.reset();
    setSelectedDate("");
    setSelectedTime("");
    setStatus("idle");
    setMessage("");
    setIsSuccessModalOpen(true);
  }

  return (
    <main className="site-shell form-shell">
      <h1>{t("title")}</h1>

      <form onSubmit={onSubmit}>
        <div className="form-grid" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="firstName">{t("firstName")}</label>
            <input id="firstName" name="firstName" required />
          </div>
          <div>
            <label htmlFor="lastName">{t("lastName")}</label>
            <input id="lastName" name="lastName" required />
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: "0.8rem" }}>
          <div>
            <label htmlFor="phone">{t("phone")}</label>
            <input id="phone" name="phone" required />
          </div>
          <div>
            <label htmlFor="email">{t("email")}</label>
            <input id="email" name="email" type="email" required />
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: "0.8rem" }}>
          <div>
            <label htmlFor="date">{t("date")}</label>
            <input
              id="date"
              name="date"
              type="date"
              min={todayIso}
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="time">{t("time")}</label>
            <select
              id="time"
              name="time"
              value={safeSelectedTime}
              onChange={(event) => setSelectedTime(event.target.value)}
              disabled={isTimeSelectionDisabled}
              required
            >
              <option value="" disabled>
                {!selectedDate
                  ? isPortuguese
                    ? "Escolha primeiro a data"
                    : "Select date first"
                  : availableTimeOptions.length === 0
                    ? isPortuguese
                      ? "Sem horarios disponiveis"
                      : "No available times"
                    : isPortuguese
                      ? "Escolha a hora"
                      : "Select time"}
              </option>
              {availableTimeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: "0.8rem" }}>
          <div>
            <label htmlFor="guests">{t("guests")}</label>
            <select id="guests" name="guests" required defaultValue="">
              <option value="" disabled>
                {t("guestsPlaceholder")}
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6+">6+</option>
            </select>
          </div>
          <div>
            <label htmlFor="occasion">{t("occasion")}</label>
            <input id="occasion" name="occasion" placeholder={t("occasionPlaceholder")} />
          </div>
        </div>

        <div style={{ marginTop: "0.8rem" }}>
          <label htmlFor="notes">{t("notes")}</label>
          <textarea id="notes" name="notes" />
        </div>

        <div className="reserve-submit-row">
          <button className="btn btn-primary reserve-submit-btn" disabled={status === "loading"}>
            {status === "loading" ? t("submitting") : t("submit")}
          </button>
          {effectiveMessage ? <span className="footer-note">{effectiveMessage}</span> : null}
        </div>
      </form>

      {workingHoursErrorModalMessage ? (
        <>
          <button
            className="confirm-modal-backdrop"
            type="button"
            aria-label={t("successModalClose")}
            onClick={() => setWorkingHoursErrorModalMessage("")}
          />
          <div className="confirm-modal-wrap" onClick={() => setWorkingHoursErrorModalMessage("")}>
            <section className="confirm-modal-card" onClick={(event) => event.stopPropagation()}>
              <h3>{locale === "pt" ? "Fora do Horario" : "Outside Working Hours"}</h3>
              <p className="footer-note" style={{ marginTop: "0.6rem" }}>
                {workingHoursErrorModalMessage}
              </p>
              <div className="confirm-modal-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setWorkingHoursErrorModalMessage("")}
                >
                  {t("successModalClose")}
                </button>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {isSuccessModalOpen ? (
        <>
          <button
            className="confirm-modal-backdrop"
            type="button"
            aria-label={t("successModalClose")}
            onClick={() => setIsSuccessModalOpen(false)}
          />
          <div className="confirm-modal-wrap" onClick={() => setIsSuccessModalOpen(false)}>
            <section className="confirm-modal-card" onClick={(event) => event.stopPropagation()}>
              <h3>{t("successModalTitle")}</h3>
              <p className="footer-note" style={{ marginTop: "0.6rem" }}>
                {t("success")}
              </p>
              <div className="confirm-modal-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setIsSuccessModalOpen(false)}
                >
                  {t("successModalClose")}
                </button>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}

export default function ReservePage() {
  return (
    <>
      <PublicNav />
      <Suspense fallback={<main className="site-shell form-shell" />}>
        <ReservePageContent />
      </Suspense>
    </>
  );
}
