"use client";

import { useEffect } from "react";
import { useState } from "react";

type QuickFindCategory = {
  id: string;
  label: string;
};

type Props = {
  quickFindLabel: string;
  categories: QuickFindCategory[];
};

export default function MenuQuickFind({
  quickFindLabel,
  categories,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryEmoji = (id: string): string => {
    switch (id) {
      case "starters":
        return "🥑";
      case "tacos":
        return "🌮";
      case "burritos":
        return "🌯";
      case "signature":
        return "⭐";
      case "desserts":
        return "🍰";
      case "drinks":
        return "🍹";
      default:
        return "🍽️";
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`quick-filter-backdrop ${isOpen ? "open" : ""}`}
        aria-label="Close quick filter"
        onClick={() => setIsOpen(false)}
      />

      <button
        type="button"
        className="quick-filter-fab"
        aria-label={quickFindLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "✕" : quickFindLabel}
      </button>

      <section
        className={`quick-filter-panel ${isOpen ? "open" : ""}`}
        aria-label={quickFindLabel}
        aria-hidden={!isOpen}
      >
        <strong>{quickFindLabel}</strong>
        {categories.map((category) => (
          <a
            className="quick-chip category-chip"
            href={`#${category.id}`}
            key={`jump-${category.id}`}
            onClick={() => setIsOpen(false)}
          >
            {categoryEmoji(category.id)} {category.label}
          </a>
        ))}
      </section>
    </>
  );
}
