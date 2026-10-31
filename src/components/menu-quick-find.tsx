"use client";

import { useEffect, useState } from "react";

type QuickFindCategory = {
  id: string;
  label: string;
};

type Props = {
  quickFindLabel: string;
  closeLabel: string;
  categories: QuickFindCategory[];
};

export default function MenuQuickFind({ quickFindLabel, closeLabel, categories }: Props) {
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
        aria-label={closeLabel}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
      />

      <button
        type="button"
        className="quick-filter-fab"
        aria-expanded={isOpen}
        aria-controls="menu-quick-find-panel"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? closeLabel : quickFindLabel}
      </button>

      <nav
        id="menu-quick-find-panel"
        className={`quick-filter-panel ${isOpen ? "open" : ""}`}
        aria-label={quickFindLabel}
      >
        <strong>{quickFindLabel}</strong>
        {categories.map((category) => (
          <a
            className="quick-chip"
            href={`#${category.id}`}
            key={`jump-${category.id}`}
            onClick={() => setIsOpen(false)}
          >
            {category.label}
          </a>
        ))}
      </nav>
    </>
  );
}
