import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/lib/site-url";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const metadataCopy = {
  en: {
    title: "Reserve V2 - Tláloc Restaurant",
    description: "New reservation flow for Tláloc Restaurant.",
  },
  pt: {
    title: "Reservas V2 - Tláloc Restaurant",
    description: "Novo fluxo de reservas do Tláloc Restaurant.",
  },
} as const;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = routing.locales.includes(locale as "en" | "pt")
    ? locale
    : routing.defaultLocale;
  const copy = metadataCopy[activeLocale as "en" | "pt"];
  const base = getSiteBaseUrl();
  const path = `/${activeLocale}/reserve-v2`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `${base}${path}` },
  };
}

export default function ReserveV2LocaleLayout({ children }: Props) {
  return children;
}
