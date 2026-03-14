"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import PublicNav from "@/components/public-nav";
import type { Locale } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export default function ReservePage() {
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const t = useTranslations("ReservePage");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
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
      date: formData.get("date"),
      time: formData.get("time"),
      guests: formData.get("guests"),
      occasion: formData.get("occasion"),
      notes: formData.get("notes"),
    };

    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(json.error ?? t("error"));
      return;
    }

    form.reset();
    setStatus("success");
    setMessage(t("success"));
  }

  return (
    <>
      <PublicNav />

      <main className="site-shell form-shell">
        <h1>{t("title")}</h1>
        <p className="footer-note">{t("subtitle")}</p>

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
              <input id="date" name="date" type="date" required />
            </div>
            <div>
              <label htmlFor="time">{t("time")}</label>
              <input id="time" name="time" type="time" required />
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

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.7rem",
              alignItems: "center",
            }}
          >
            <button className="btn btn-primary" disabled={status === "loading"}>
              {status === "loading" ? t("submitting") : t("submit")}
            </button>
            {effectiveMessage ? <span className="footer-note">{effectiveMessage}</span> : null}
          </div>
        </form>
      </main>
    </>
  );
}
