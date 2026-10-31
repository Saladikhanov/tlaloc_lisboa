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
    title: { absolute: t("metaTitle") },
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
  const [t, schedule, businessContact] = await Promise.all([
    getTranslations({ locale: activeLocale, namespace: "Home" }),
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

      <main id="main-content" className="site-shell">
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

        <section className="home-visit full-bleed on-teal" aria-label={t("visitTitle")}>
          <div className="home-visit-inner">
            <div className="home-visit-block">
              <h2>{t("workingHoursTitle")}</h2>
              <dl className="home-facts">
                <div>
                  <dt>{t("dayMonThu")}</dt>
                  <dd>{monThuText}</dd>
                </div>
                <div>
                  <dt>{t("dayFriSat")}</dt>
                  <dd>{friSatText}</dd>
                </div>
                <div>
                  <dt>{t("daySun")}</dt>
                  <dd>{sundayText}</dd>
                </div>
              </dl>
            </div>
            <div className="home-visit-block">
              <h2>{t("visitTitle")}</h2>
              <address className="home-facts-address">
                <dl className="home-facts">
                  <div>
                    <dt>{t("addressLabel")}</dt>
                    <dd>
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        R. do Cruzeiro 1, 1300-160 Lisboa
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("phoneLabel")}</dt>
                    <dd>
                      <a href="tel:+351218093388">+351 21 809 3388</a>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("whatsappLabel")}</dt>
                    <dd>
                      <a
                        href={`https://wa.me/${whatsappDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {businessContact.businessPhone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("emailLabel")}</dt>
                    <dd>
                      <a href={`mailto:${businessContact.businessEmail}`}>
                        {businessContact.businessEmail}
                      </a>
                    </dd>
                  </div>
                </dl>
              </address>
              <p className="home-visit-note">{t("pricingInfo")}</p>
              <Link className="btn btn-primary" href="/reserve">
                {t("reserve")}
              </Link>
            </div>
          </div>
        </section>

        <HomeGallery />

        <section className="home-about" aria-labelledby="home-about-title">
          <h2 id="home-about-title">{t("seoBlockTitle")}</h2>
          <div className="home-about-text">
            <p>{t("seoBlockBody1")}</p>
            <p>{t("seoBlockBody2")}</p>
          </div>
        </section>

        <section className="home-faq" aria-labelledby="home-faq-title">
          <h2 id="home-faq-title">{t("faqTitle")}</h2>
          <div className="home-faq-list">
            {faqItems.map((item) => (
              <details key={item.question} className="home-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
