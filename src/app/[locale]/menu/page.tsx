import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/types";
import PublicNav from "@/components/public-nav";
import MenuQuickFind from "@/components/menu-quick-find";
import { routing } from "@/i18n/routing";
import { getMenuData } from "@/lib/menu-store";
import { getSiteBaseUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

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
  const t = await getTranslations({
    locale,
    namespace: "MenuPage",
  });
  const menuData = await getMenuData();

  return (
    <>
      <PublicNav headerTitle={t("headerTitle")} />

      <main className="site-shell menu-page">
        <div className="menu-top-zigzag" aria-hidden="true" />

        <MenuQuickFind
          quickFindLabel={t("quickFind")}
          categories={menuData.map((category) => ({
            id: category.id,
            label: category.title[locale],
          }))}
        />

        <section className="menu-block">
          {menuData.map((category) => (
            <section className="menu-section" id={category.id} key={category.id}>
              <h2>{category.title[locale]}</h2>
              {category.subtitle ? <p className="footer-note">{category.subtitle[locale]}</p> : null}
              <div className="items-grid" style={{ marginTop: "0.7rem" }}>
                {category.items.map((item) => (
                  <article className="item" key={`${category.id}-${item.name.en}`}>
                    <div className="item-top">
                      <h3>
                        {item.name[locale]}
                        {item.vegetarian ? (
                          <span className="title-veg" aria-label="Vegetarian">
                            {" "}
                            🌱
                          </span>
                        ) : null}
                      </h3>
                      <span className="item-price">{item.price}</span>
                    </div>
                    <p>{item.description[locale]}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <p className="footer-note">{t("footnote")}</p>

        <div className="menu-bottom-stripe" aria-hidden="true" />
      </main>
    </>
  );
}
