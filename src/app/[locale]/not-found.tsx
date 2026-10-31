import Image from "next/image";
import { getTranslations } from "next-intl/server";
import PublicNav from "@/components/public-nav";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <>
      <PublicNav />
      <main id="main-content" className="site-shell">
        <section className="status-band full-bleed" aria-labelledby="not-found-title">
          <div className="status-inner">
            <Image
              className="status-mascot"
              src="/mascot_logo.webp"
              alt=""
              width={112}
              height={112}
              priority
            />
            <h1 id="not-found-title">{t("title")}</h1>
            <p>{t("body")}</p>
            <div className="status-actions">
              <Link className="btn btn-primary" href="/">
                {t("home")}
              </Link>
              <Link className="btn btn-secondary" href="/menu">
                {t("menu")}
              </Link>
              <Link className="btn btn-secondary" href="/reserve">
                {t("reserve")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
