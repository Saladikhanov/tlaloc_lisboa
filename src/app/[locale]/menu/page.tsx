import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/types";
import PublicNav from "@/components/public-nav";
import MenuQuickFind from "@/components/menu-quick-find";
import { routing } from "@/i18n/routing";
import { getMenuData } from "@/lib/menu-store";
import { getSiteBaseUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const BAND_COLORS = ["lime", "chile", "teal", "cyan"] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = (
    routing.locales.includes(routeLocale as "en" | "pt")
      ? routeLocale
      : routing.defaultLocale
  ) as Locale;
  const t = await getTranslations({ locale, namespace: "MenuPage" });
  const base = getSiteBaseUrl();
  const path = `/${locale}/menu`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `${base}${path}` },
  };
}

export default async function MenuPage({ params }: Props) {
  const { locale: routeLocale } = await params;
  const locale = (
    routing.locales.includes(routeLocale as "en" | "pt")
      ? routeLocale
      : routing.defaultLocale
  ) as Locale;
  const [t, menuData] = await Promise.all([
    getTranslations({ locale, namespace: "MenuPage" }),
    getMenuData(),
  ]);

  return (
    <>
      <PublicNav />

      <main id="main-content" className="site-shell menu-page">
        <header className="menu-head">
          <h1>{t("title")}</h1>
        </header>

        <MenuQuickFind
          quickFindLabel={t("quickFind")}
          closeLabel={t("closeQuickFind")}
          categories={menuData.map((category) => ({
            id: category.id,
            label: category.title[locale],
          }))}
        />

        {menuData.map((category, index) => (
          <section
            className="menu-section"
            id={category.id}
            key={category.id}
            aria-labelledby={`${category.id}-title`}
          >
            <div className={`menu-band full-bleed band-${BAND_COLORS[index % BAND_COLORS.length]}`}>
              <div className="menu-band-inner">
                <h2 id={`${category.id}-title`}>{category.title[locale]}</h2>
                {category.subtitle ? (
                  <p className="menu-section-note">{category.subtitle[locale]}</p>
                ) : null}
              </div>
            </div>
            <ul className="menu-items">
              {category.items.map((item) => (
                <li className="menu-item" key={`${category.id}-${item.name.en}`}>
                  <div className="menu-item-top">
                    <div className="menu-item-name">
                      <h3>{item.name[locale]}</h3>
                      {item.vegetarian ? (
                        <span className="menu-veg">{t("vegetarian")}</span>
                      ) : null}
                    </div>
                    <span className="menu-item-dots" aria-hidden="true" />
                    <span className="menu-item-price">{item.price}</span>
                  </div>
                  {item.description[locale] ? <p>{item.description[locale]}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="menu-footnote">{t("footnote")}</p>
      </main>
    </>
  );
}
