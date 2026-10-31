import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import DocumentShell from "@/components/document-shell";
import SiteFooter from "@/components/site-footer";
import { routing } from "@/i18n/routing";
import { getPublicWhatsappNumber } from "@/lib/tutorial-settings-store";

export const revalidate = 60;

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [messagesModule, tNav, whatsappNumber] = await Promise.all([
    import(`../../../messages/${locale}.json`),
    getTranslations({ locale, namespace: "Nav" }),
    getPublicWhatsappNumber(),
  ]);
  const messages = messagesModule.default;

  return (
    <DocumentShell lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <a className="skip-link" href="#main-content">
          {tNav("skip")}
        </a>
        {children}
        <SiteFooter whatsappNumber={whatsappNumber} />
      </NextIntlClientProvider>
    </DocumentShell>
  );
}
