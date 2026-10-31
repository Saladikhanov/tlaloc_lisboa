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
import { listTutorialSettings } from "@/lib/tutorial-settings-store";
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
        "melhores tacos Lisboa",
        "melhores margaritas Lisboa",
        "tacos Lisboa",
        "margaritas Lisboa",
        "Tláloc",
      ]
      : [
        "Mexican restaurant Lisbon",
        "Mexican food Lisbon",
        "Alcântara restaurant",
        "best tacos Lisbon",
        "best margaritas Lisbon",
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
      type: "website",
      url: `${base}${path}`,
      locale: activeLocale === "pt" ? "pt_PT" : "en_US",
      alternateLocale: activeLocale === "pt" ? "en_US" : "pt_PT",
      images: [
        {
          url: `${base}/og_image.jpg`,
          width: 1200,
          height: 630,
          alt: "Tláloc Restaurant",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${base}/og_image.jpg`],
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
  const [schedule, businessContact] = await Promise.all([
    listWorkingHours(),
    listTutorialSettings(),
  ]);
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
  const whatsappDigits = businessContact.businessPhone.replace(/[^\d]/g, "");
  const restaurantJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${base}/#restaurant`,
    name: "Tláloc Restaurant",
    alternateName: "Tláloc Cantina",
    image: [`${base}/og_image.jpg`],
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
  const faqItems = [
    { question: t("faqQuestion1"), answer: t("faqAnswer1") },
    { question: t("faqQuestion2"), answer: t("faqAnswer2") },
    { question: t("faqQuestion3"), answer: t("faqAnswer3") },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PublicNav />

      <main className="site-shell">
        <section className="home-hero full-bleed" aria-labelledby="home-hero-title">
          <div className="home-hero-copy">
            <HomeOpenStatus
              initialOpen={isOpenNow}
              openLabel={t("currentlyOpen")}
              closedLabel={t("currentlyClosed")}
            />
            <h1 id="home-hero-title">{t("heroHeading")}</h1>
            <p className="home-hero-sub">{t("heroSubheading")}</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" href="/reserve">
                {t("reserve")}
              </Link>
              <Link className="btn btn-secondary" href="/menu">
                {t("openMenu")}
              </Link>
              <DeliveryButton label={t("orderDelivery")} />
            </div>
            <p className="home-hero-desc">{t("heroDescription")}</p>
          </div>
          <div className="home-hero-media">
            <Image
              src="/backgroundTlaloc.webp"
              alt={t("heroImageAlt")}
              fill
              priority
              quality={80}
              sizes="(min-width: 861px) 55vw, 100vw"
            />
          </div>
        </section>

        <section className="card home-hours-card">
          <p className="home-section-kicker">🕐 {isPortuguese ? "HORARIO" : "OPENING HOURS"}</p>
          <div className="home-hours-head">
            <h3>{t("workingHoursTitle")}</h3>
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

        <section className="card home-seo-card">
          <p className="home-section-kicker">🌮 {t("seoBlockTitle")}</p>
          <h3>{isPortuguese ? "Restaurante mexicano em Lisboa e Alcântara" : "Mexican restaurant in Lisbon and Alcântara"}</h3>
          <p>{t("seoBlockBody1")}</p>
          <p className="footer-note" style={{ marginTop: "0.75rem" }}>
            {t("seoBlockBody2")}
          </p>
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
            Alcântara, Lisbon
          </p>
          <p style={{ marginTop: "0.55rem" }}>
            <strong>📞</strong> <a href="tel:+351218093388">+351 21 809 3388</a>
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>📱</strong>{" "}
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer">
              {businessContact.businessPhone} (WhatsApp)
            </a>
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>✉️</strong> <a href={`mailto:${businessContact.businessEmail}`}>{businessContact.businessEmail}</a>
          </p>
          <p className="footer-note" style={{ marginTop: "0.55rem" }}>
            {t("pricingInfo")}
          </p>
        </section>

        <section className="card home-faq-card">
          <p className="home-section-kicker">❓ {t("faqTitle")}</p>
          <div className="home-faq-list">
            {faqItems.map((item) => (
              <details key={item.question} className="home-faq-item">
                <summary>{item.question}</summary>
                <p className="footer-note">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
