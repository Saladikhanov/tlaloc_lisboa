import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PublicNav from "@/components/public-nav";
import DeliveryButton from "@/components/delivery-button";
import { routing } from "@/i18n/routing";
import { listWorkingHours, type WorkingHoursRecord } from "@/lib/working-hours-store";

type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const mapsUrl = "https://maps.google.com/?q=R.+do+Cruzeiro+1+Lisboa";

const toMinutes = (timeValue: string | null): number | null => {
  if (!timeValue) {
    return null;
  }

  const [hoursString, minutesString] = timeValue.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const isOpenNowForDay = (dayHours: WorkingHoursRecord, currentMinutes: number): boolean => {
  if (dayHours.isClosed) {
    return false;
  }

  const isInsideShift = (open: string | null, close: string | null) => {
    const openMinutes = toMinutes(open);
    const closeMinutes = toMinutes(close);
    if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
      return false;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  return (
    isInsideShift(dayHours.lunchOpen, dayHours.lunchClose) ||
    isInsideShift(dayHours.dinnerOpen, dayHours.dinnerClose)
  );
};

const getLisbonNow = (): { weekday: number; minutes: number } => {
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  const timeValue = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const [hoursString, minutesString] = timeValue.split(":");
  const hours = Number(hoursString) || 0;
  const minutes = Number(minutesString) || 0;
  return {
    weekday: weekdayMap[weekdayShort] ?? 0,
    minutes: hours * 60 + minutes,
  };
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const activeLocale = routing.locales.includes(locale as "en" | "pt")
    ? locale
    : routing.defaultLocale;
  const isPortuguese = activeLocale === "pt";
  const t = await getTranslations({
    locale: activeLocale,
    namespace: "Home",
  });
  const schedule = await listWorkingHours();
  const lisbonNow = getLisbonNow();
  const todayHours = schedule.find((entry) => entry.weekday === lisbonNow.weekday);
  const isOpenNow = todayHours ? isOpenNowForDay(todayHours, lisbonNow.minutes) : false;
  const getDayHours = (weekday: number) => schedule.find((entry) => entry.weekday === weekday);
  const mon = getDayHours(1);
  const thu = getDayHours(4);
  const fri = getDayHours(5);
  const sat = getDayHours(6);
  const sun = getDayHours(0);
  const monThuText =
    mon && thu && !mon.isClosed && !thu.isClosed
      ? `${mon.lunchOpen ?? "--:--"}-${mon.lunchClose ?? "--:--"} · ${mon.dinnerOpen ?? "--:--"}-${mon.dinnerClose ?? "--:--"}`
      : t("closedLabel");
  const friSatText =
    fri && sat && !fri.isClosed && !sat.isClosed
      ? `${fri.lunchOpen ?? "--:--"}-${fri.lunchClose ?? "--:--"} · ${fri.dinnerOpen ?? "--:--"}-${fri.dinnerClose ?? "--:--"}`
      : t("closedLabel");
  const sundayText = sun?.isClosed ? t("closedLabel") : `${sun?.lunchOpen ?? "--:--"}-${sun?.lunchClose ?? "--:--"}`;

  return (
    <>
      <PublicNav />

      <main className="site-shell">
        <div className="menu-top-zigzag" aria-hidden="true" />

        <section className="hero">
          <div className="home-hero-content">
            <Image
              className="home-hero-image"
              src="/op_image.webp"
              alt="Tláloc Cantina"
              width={1200}
              height={630}
              priority
            />

            <h1>Tacos · Margaritas · Boas Vibrações</h1>
            <p>{t("heroDescription")}</p>
          </div>

          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/menu">
              {t("openMenu")}
            </Link>
            <Link className="btn btn-secondary" href="/reserve">
              {t("reserve")}
            </Link>
            <DeliveryButton label={t("orderDelivery")} />
          </div>
        </section>

        <section className="card home-hours-card">
          <p className="home-section-kicker">🕐 {isPortuguese ? "HORARIO" : "OPENING HOURS"}</p>
          <div className="home-hours-head">
            <h3>{t("workingHoursTitle")}</h3>
            <p className={`home-open-status ${isOpenNow ? "open" : "closed"}`}>
              <span className="home-open-status-dot" />
              {isOpenNow ? t("currentlyOpen") : t("currentlyClosed")}
            </p>
          </div>
          <div className="home-hours-summary">
            <p className="home-hours-line">
              <strong>{isPortuguese ? "Seg - Qui" : "Mon - Thu"}</strong>
              <span>{monThuText}</span>
            </p>
            <p className="home-hours-line">
              <strong>{isPortuguese ? "Sex - Sab" : "Fri - Sat"}</strong>
              <span>{friSatText}</span>
            </p>
            <p className="home-hours-line">
              <strong>{isPortuguese ? "Domingo" : "Sunday"}</strong>
              <span>{sundayText}</span>
            </p>
          </div>
        </section>

        <section className="card home-contact-card">
          <p className="home-section-kicker">📍 LOCATION & CONTACT</p>
          <p>
            <strong>🏠</strong>{" "}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              R. do Cruzeiro 1, 1300-160 Lisboa
            </a>
          </p>
          <p className="footer-note" style={{ marginTop: "0.35rem" }}>
            Alto de Santo Amaro / Alcântara
          </p>
          <p style={{ marginTop: "0.55rem" }}>
            <strong>📞</strong> <a href="tel:+351218093388">+351 21 809 3388</a>
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>📱</strong>{" "}
            <a href="https://wa.me/351933357555" target="_blank" rel="noopener noreferrer">
              +351 933 357 555 (WhatsApp)
            </a>
          </p>
          <p className="footer-note" style={{ marginTop: "0.55rem" }}>
            {t("pricingInfo")}
          </p>
        </section>

        <div className="menu-bottom-stripe" aria-hidden="true" />
      </main>
    </>
  );
}
