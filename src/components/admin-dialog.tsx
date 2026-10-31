"use client";

import { useEffect, useRef } from "react";

type Props = {
  titleId: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  wide?: boolean;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Glass dialog over a backdrop. Moves focus inside on open, keeps Tab inside, closes on Escape and
 * returns focus to whatever opened it.
 */
export default function AdminDialog({
  titleId,
  describedBy,
  role = "dialog",
  wide = false,
  closeLabel,
  onClose,
  children,
}: Props) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) {
        return;
      }
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, []);

  return (
    <div className="admin-v2">
      <button
        className="admin-dialog-backdrop"
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="admin-dialog-wrap" onClick={onClose}>
        <section
          ref={dialogRef}
          className={`admin-dialog${wide ? " admin-dialog--wide" : ""}`}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </section>
      </div>
    </div>
  );
}
