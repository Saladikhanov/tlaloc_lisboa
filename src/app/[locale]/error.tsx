"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import PublicNav from "@/components/public-nav";
import { Link } from "@/i18n/navigation";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Error");

  return (
    <>
      <PublicNav />
      <main id="main-content" className="site-shell">
      <section className="status-band full-bleed" aria-labelledby="error-title">
        <div className="status-inner">
          <Image
            className="status-mascot"
            src="/mascot_logo.webp"
            alt=""
            width={112}
            height={112}
          />
          <h1 id="error-title">{t("title")}</h1>
          <p>{t("body")}</p>
          <div className="status-actions">
            <button className="btn btn-primary" type="button" onClick={reset}>
              {t("retry")}
            </button>
            <Link className="btn btn-secondary" href="/">
              {t("home")}
            </Link>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
