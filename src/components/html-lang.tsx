"use client";

import { useEffect } from "react";

// The root layout is shared with the admin, so it cannot know the locale. This keeps
// <html lang> in sync for screen readers on the localized pages.
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
