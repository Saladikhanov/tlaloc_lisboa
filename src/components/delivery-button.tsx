"use client";

import { UBER_EATS_WEB_URL } from "@/lib/contact";

// Best-effort deep-linking:
// - Android: intent URL opens app if installed, otherwise falls back to web URL.
// - iOS: try custom scheme first, then fallback to web URL.
// Browsers do not provide a reliable API to definitively detect app installation.
export default function DeliveryButton({ label }: { label: string }) {
  const onOpenDelivery = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Keep native link behaviour (new tab, copy link, Cmd/Ctrl-click) except for the app deep link on phones.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    const ua = navigator.userAgent || navigator.vendor;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (!isAndroid && !isIOS) {
      return;
    }

    event.preventDefault();

    if (isAndroid) {
      const intentUrl =
        `intent://www.ubereats.com/pt-en/store/tlaloc-un-rincon-mexicana/WZywXn7kQiOh8tBFs4dwog` +
        `#Intent;scheme=https;package=com.ubercab.eats;S.browser_fallback_url=${encodeURIComponent(
          UBER_EATS_WEB_URL,
        )};end`;
      window.location.href = intentUrl;
      return;
    }

    if (isIOS) {
      let didHide = false;
      const onVisibility = () => {
        if (document.visibilityState === "hidden") {
          didHide = true;
        }
      };

      document.addEventListener("visibilitychange", onVisibility, { once: true });
      window.location.href = "ubereats://";
      window.setTimeout(() => {
        if (!didHide) {
          window.location.href = UBER_EATS_WEB_URL;
        }
      }, 900);
      return;
    }
  };

  return (
    <a
      className="btn btn-secondary"
      href={UBER_EATS_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpenDelivery}
    >
      {label}
    </a>
  );
}
