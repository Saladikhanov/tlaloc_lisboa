import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import MotionProvider from "@/components/motion-provider";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/site-url";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = routing.locales.includes(locale as "en" | "pt")
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: activeLocale, namespace: "ReservePage" });
  const base = getSiteBaseUrl();
  const path = `/${activeLocale}/reserve`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `${base}${path}` },
  };
}

export default function ReserveLocaleLayout({ children }: Props) {
  return <MotionProvider>{children}</MotionProvider>;
}
