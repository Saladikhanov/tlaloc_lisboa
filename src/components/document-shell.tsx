import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import ScrollToTop from "@/components/scroll-to-top";
import { getSiteBaseUrl } from "@/lib/site-url";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

type Props = {
  lang: string;
  className?: string;
  children: React.ReactNode;
};

// Shared <html>/<body> for every route tree; `lang` is set per tree so crawlers and screen
// readers get the right language without waiting for hydration.
export default function DocumentShell({ lang, className, children }: Props) {
  const classes = [bricolage.variable, figtree.variable, className].filter(Boolean).join(" ");

  return (
    <html lang={lang} className={classes} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- same og:logo tag the root layout rendered */}
      <head>
        <meta property="og:logo" content={`${getSiteBaseUrl()}/favicon-v2.ico`} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollToTop />
        <SpeedInsights />
      </body>
    </html>
  );
}
