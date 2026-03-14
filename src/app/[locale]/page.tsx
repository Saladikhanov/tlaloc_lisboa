import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PublicNav from "@/components/public-nav";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: routing.locales.includes(locale as "en" | "pt")
      ? locale
      : routing.defaultLocale,
    namespace: "Home",
  });

  return (
    <>
      <PublicNav />

      <main className="site-shell">
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
            <p>
              An authentic Mexican corner in the heart of Alcântara, Lisboa — homestyle recipes,
              craft margaritas, and warm hospitality that keeps you coming back.
            </p>
          </div>

          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/menu">
              {t("openMenu")}
            </Link>
            <Link className="btn btn-secondary" href="/reserve">
              {t("reserve")}
            </Link>
            <a
              className="btn btn-secondary"
              href="https://www.ubereats.com/pt-en/store/tlaloc-un-rincon-mexicana/WZywXn7kQiOh8tBFs4dwog"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("orderDelivery")}
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
