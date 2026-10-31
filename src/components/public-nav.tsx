"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type PublicNavProps = {
  headerTitle?: string;
};

export default function PublicNav({ headerTitle }: PublicNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getLocaleHref = (targetLocale: (typeof routing.locales)[number]) => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length > 0 && routing.locales.includes(segments[0] as "en" | "pt")) {
      segments.shift();
    }

    return `/${targetLocale}${segments.length > 0 ? `/${segments.join("/")}` : ""}`;
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    // Close the mobile menu on any tap outside the menu panel and the burger button, and on Escape.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".mobile-nav-links, .nav-toggle")) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let active = true;

    const loadAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as { authenticated?: boolean };
        if (active) {
          setIsAdmin(Boolean(json.authenticated));
        }
      } catch {
        if (active) {
          setIsAdmin(false);
        }
      }
    };

    void loadAdminSession();
    return () => {
      active = false;
    };
  }, [pathname]);

  const renderLinks = (closeOnClick: boolean) => (
    <>
      <Link
        href="/menu"
        aria-current={pathname.endsWith("/menu") ? "page" : undefined}
        onClick={closeOnClick ? () => setIsMenuOpen(false) : undefined}
      >
        {t("menu")}
      </Link>
      <Link
        href="/reserve"
        aria-current={pathname.endsWith("/reserve") ? "page" : undefined}
        onClick={closeOnClick ? () => setIsMenuOpen(false) : undefined}
      >
        {t("reserve")}
      </Link>
      {isAdmin ? (
        <NextLink href="/admin" onClick={closeOnClick ? () => setIsMenuOpen(false) : undefined}>
          {t("admin")}
        </NextLink>
      ) : null}
    </>
  );

  const renderLanguageSwitch = (closeOnClick: boolean, className = "lang-switch") => (
    <div className={className} role="group" aria-label="Language switch">
      {routing.locales.map((item) => (
        <NextLink
          key={item}
          className={`lang-btn ${item === locale ? "active" : ""}`}
          aria-current={item === locale ? "page" : undefined}
          href={getLocaleHref(item)}
          onClick={closeOnClick ? () => setIsMenuOpen(false) : undefined}
        >
          {item.toUpperCase()}
        </NextLink>
      ))}
    </div>
  );

  return (
    <>
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link className="brand" href="/">
            <Image
              className="brand-image"
              src="/mascot_logo.webp"
              alt="Tláloc Restaurant"
              width={42}
              height={42}
              sizes="42px"
              priority
            />
          </Link>
          {headerTitle ? <div className="header-page-title">{headerTitle}</div> : null}
          <div className="mobile-nav-controls">
            <div className="mobile-lang-switch-wrap">
              {renderLanguageSwitch(false, "lang-switch mobile-lang-switch")}
            </div>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={isMenuOpen}
              aria-controls="public-mobile-menu"
              aria-label="Toggle navigation menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <motion.span
                animate={isMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.18 }}
              />
              <motion.span
                animate={isMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
          <div className="nav-links desktop-nav-links">
            {renderLinks(false)}
            {renderLanguageSwitch(false, "lang-switch desktop-lang-switch")}
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            id="public-mobile-menu"
            className="nav-links mobile-nav-links open"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {renderLinks(true)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
