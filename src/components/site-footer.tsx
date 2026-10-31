"use client";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LANDLINE_DISPLAY, LANDLINE_TEL } from "@/lib/contact";

export default function SiteFooter({ whatsappNumber }: { whatsappNumber: string }) {
  const locale = useLocale();
  const t = useTranslations("Footer");

  const locationLabel = locale === "pt" ? "Alcântara, Lisboa" : "Alcântara, Lisbon";

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-block">
          <p className="site-footer-brand" translate="no">Tláloc</p>
          <p className="footer-note">{t("tagline")}</p>
        </div>

        <div className="site-footer-block">
          <p className="site-footer-heading">{t("explore")}</p>
          <div className="site-footer-links">
            <Link href="/">{t("home")}</Link>
            <Link href="/menu">{t("menu")}</Link>
            <Link href="/reserve">{t("reserve")}</Link>
          </div>
        </div>

        <div className="site-footer-block">
          <p className="site-footer-heading">{t("contact")}</p>
          <div className="site-footer-links">
            <NextLink href="https://maps.google.com/?q=R.+do+Cruzeiro+1+Lisboa" target="_blank" rel="noopener noreferrer">
              {locationLabel}
            </NextLink>
            <NextLink href={`tel:${LANDLINE_TEL}`}>{LANDLINE_DISPLAY}</NextLink>
            <NextLink href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </NextLink>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>{t("copyright")}</span>
      </div>
    </footer>
  );
}
