import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const normalized = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return {
    locale: normalized,
    messages: (await import(`../../messages/${normalized}.json`)).default,
  };
});
