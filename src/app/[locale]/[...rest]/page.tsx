import { notFound } from "next/navigation";

// Unknown paths under a locale (for example /en/does-not-exist) render the locale-aware
// not-found page, with the nav and footer, instead of the bare root one.
export default function LocaleCatchAll() {
  notFound();
}
