"use client";

import { useEffect } from "react";
import { useState } from "react";

type QuickFindCategory = {
  id: string;
  label: string;
};

type Props = {
  quickFindLabel: string;
  jumpFoodLabel: string;
  jumpDrinksLabel: string;
  categories: QuickFindCategory[];
};

export default function MenuQuickFind({
  quickFindLabel,
  jumpFoodLabel,
  jumpDrinksLabel,
  categories,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

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
        {quickFindLabel}
      </button>

      <section
        className={`quick-filter-panel ${isOpen ? "open" : ""}`}
        aria-label={quickFindLabel}
        aria-hidden={!isOpen}
      >
        <strong>{quickFindLabel}</strong>
        <a className="quick-chip" href="#food-section" onClick={() => setIsOpen(false)}>
          {jumpFoodLabel}
        </a>
        <a className="quick-chip" href="#drinks-section" onClick={() => setIsOpen(false)}>
          {jumpDrinksLabel}
        </a>
        {categories.map((category) => (
          <a
            className="quick-chip category-chip"
            href={`#${category.id}`}
            key={`jump-${category.id}`}
            onClick={() => setIsOpen(false)}
          >
            {category.label}
          </a>
        ))}
      </section>
    </>
  );
}
