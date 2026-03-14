import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/types";
import PublicNav from "@/components/public-nav";
import MenuQuickFind from "@/components/menu-quick-find";
import { routing } from "@/i18n/routing";
import { getMenuData } from "@/lib/menu-store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

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
  const drinkCategoryIds = new Set(["drinks"]);
  const foodCategories = menuData.filter((category) => !drinkCategoryIds.has(category.id));
  const drinkCategories = menuData.filter((category) => drinkCategoryIds.has(category.id));

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

        <section id="food-section" className="menu-block">
          <h2 className="menu-block-title">{t("foodSection")}</h2>
          {foodCategories.map((category) => (
            <section className="menu-section" id={category.id} key={category.id}>
              <h2>{category.title[locale]}</h2>
              {category.subtitle ? (
                <p className="footer-note">{category.subtitle[locale]}</p>
              ) : null}
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

        <section id="drinks-section" className="menu-block">
          <h2 className="menu-block-title">{t("drinksSection")}</h2>
          {drinkCategories.map((category) => (
            <section className="menu-section" id={category.id} key={category.id}>
              {category.id !== "drinks" ? <h2>{category.title[locale]}</h2> : null}
              {category.subtitle ? (
                <p className="footer-note">{category.subtitle[locale]}</p>
              ) : null}
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
