import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PublicNav from "@/components/public-nav";
import DeliveryButton from "@/components/delivery-button";
import { routing } from "@/i18n/routing";
import HomeGallery from "@/components/home-gallery";
import HomeOpenStatus from "@/components/home-open-status";
import { computeIsOpenNow } from "@/lib/working-hours-open-now";
import { listWorkingHours } from "@/lib/working-hours-store";
import { getSiteBaseUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const mapsUrl = "https://maps.google.com/?q=R.+do+Cruzeiro+1+Lisboa";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = routing.locales.includes(locale as "en" | "pt")
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: activeLocale, namespace: "Home" });
  const base = getSiteBaseUrl();
  const path = `/${activeLocale}`;
  const keywords =
    activeLocale === "pt"
      ? [
          "restaurante mexicano Lisboa",
          "comida mexicana Lisboa",
          "Alcântara restaurante",
          "tacos Lisboa",
          "margaritas Lisboa",
          "Tláloc",
        ]
      : [
          "Mexican restaurant Lisbon",
          "Mexican food Lisbon",
          "Alcântara restaurant",
          "tacos Lisbon",
          "margaritas Lisbon",
          "Tláloc",
        ];

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords,
    alternates: {
      canonical: `${base}${path}`,
      languages: {
        en: `${base}/en`,
        pt: `${base}/pt`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${base}${path}`,
      locale: activeLocale === "pt" ? "pt_PT" : "en_US",
      alternateLocale: activeLocale === "pt" ? "en_US" : "pt_PT",
    },
  };
}

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
  const isOpenNow = computeIsOpenNow(schedule);
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

  const base = getSiteBaseUrl();
  const restaurantJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${base}/#restaurant`,
    name: "Tláloc Restaurant",
    alternateName: "Tláloc Cantina",
    image: [`${base}/op_image.webp`],
    url: `${base}/${activeLocale}`,
    telephone: "+351218093388",
    servesCuisine: ["Mexican"],
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: "R. do Cruzeiro 1",
      addressLocality: "Lisboa",
      postalCode: "1300-160",
      addressRegion: "Lisboa",
      addressCountry: "PT",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 38.7039,
      longitude: -9.1749,
    },
    areaServed: [
      { "@type": "City", name: "Lisbon" },
      { "@type": "AdministrativeArea", name: "Alcântara, Lisbon" },
    ],
    hasMenu: `${base}/${activeLocale}/menu`,
    acceptsReservations: true,
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/${activeLocale}/reserve`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
      />
      <PublicNav />

      <main className="site-shell">
        <div className="menu-top-zigzag" aria-hidden="true" />

        <div className="hero-fullbleed">
          <section className="hero">
            <div className="hero-bg-layer" aria-hidden="true">
              <Image
                className="hero-bg-image hero-bg-image--base"
                src="/backgroundTlaloc.webp"
                alt=""
                fill
                priority
                fetchPriority="high"
                quality={85}
                sizes="100vw"
              />
              <Image
                className="hero-bg-image hero-bg-image--blur-top"
                src="/backgroundTlaloc.webp"
                alt=""
                fill
                loading="lazy"
                fetchPriority="low"
                quality={55}
                sizes="100vw"
              />
              <Image
                className="hero-bg-image hero-bg-image--blur-band"
                src="/backgroundTlaloc.webp"
                alt=""
                fill
                loading="lazy"
                fetchPriority="low"
                quality={55}
                sizes="100vw"
              />
            </div>
            <div className="hero-scrim" aria-hidden="true" />

            <div className="home-hero-content">
              <Image
                className="home-hero-image"
                src="/op_image.webp"
                alt={t("heroImageAlt")}
                width={1200}
                height={630}
                loading="eager"
                fetchPriority="low"
                quality={85}
              />

              <h1>
                <span className="hero-h1-primary">{t("heroHeading")}</span>
                <span className="hero-h1-secondary">{t("heroSubheading")}</span>
              </h1>
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
        </div>

        <section className="home-discount-banner" aria-label={t("discountBannerHeadline")}>
          <div className="offer-block">
            <div className="offer-pct">20%</div>
            <div className="offer-label">{t("discountBannerHeadline")}</div>
            <div className="offer-desc">{t("discountBannerBody")}</div>
            <Link className="btn btn-primary home-discount-banner-cta" href="/reserve">
              <span className="btn-cta-shine-label">{t("discountBannerCta")}</span>
            </Link>
          </div>
        </section>

        <section className="card home-hours-card">
          <p className="home-section-kicker">🕐 {isPortuguese ? "HORARIO" : "OPENING HOURS"}</p>
          <div className="home-hours-head">
            <h3>{t("workingHoursTitle")}</h3>
            <HomeOpenStatus
              initialOpen={isOpenNow}
              openLabel={t("currentlyOpen")}
              closedLabel={t("currentlyClosed")}
            />
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

        <HomeGallery />

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
