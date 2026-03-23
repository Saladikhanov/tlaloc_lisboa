"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const INTERVAL_MS = 5000;

const GALLERY_IMAGES = [
  "/gallery1.webp",
  "/gallery2.webp",
  "/Gallery3.webp",
  "/gallery4.webp",
  "/gallery5.webp",
] as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function HomeGallery() {
  const t = useTranslations("Home");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const n = GALLERY_IMAGES.length;

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % n);
  }, [n]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + n) % n);
  }, [n]);

  useEffect(() => {
    if (reducedMotion || paused || n <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, n]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  return (
    <section
      className="home-gallery-card"
      aria-roledescription="carousel"
      aria-label={t("galleryTitle")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="home-gallery-frame">
          <button
            type="button"
            className="home-gallery-viewport"
            aria-label={t("galleryNextTap")}
            onClick={goNext}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={GALLERY_IMAGES[index]}
                className="home-gallery-slide"
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeInOut" }}
              >
                <Image
                  src={GALLERY_IMAGES[index]}
                  alt={t("galleryPhotoAlt", { n: index + 1 })}
                  fill
                  className="home-gallery-img"
                  sizes="(max-width: 540px) min(100vw - 2.5rem, 500px), 500px"
                  quality={100}
                  priority={index === 0}
                />
              </motion.div>
            </AnimatePresence>
          </button>

          <button
            type="button"
            className="home-gallery-arrow home-gallery-arrow-prev"
            aria-label={t("galleryPrev")}
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            className="home-gallery-arrow home-gallery-arrow-next"
            aria-label={t("galleryNext")}
            onClick={goNext}
          >
            ›
          </button>

          <div className="home-gallery-dots" role="tablist" aria-label={t("galleryTitle")}>
            {GALLERY_IMAGES.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t("galleryGoTo", { n: i + 1 })}
                className={`home-gallery-dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
      </div>
    </section>
  );
}
