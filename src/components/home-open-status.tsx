"use client";

import { useEffect, useState } from "react";
import { computeIsOpenNow } from "@/lib/working-hours-open-now";
import type { WorkingHoursRecord } from "@/lib/working-hours-store";

type Props = {
  initialOpen: boolean;
  openLabel: string;
  closedLabel: string;
};

export default function HomeOpenStatus({ initialOpen, openLabel, closedLabel }: Props) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      try {
        const response = await fetch("/api/working-hours", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as { data?: WorkingHoursRecord[] };
        if (canceled || !body.data) {
          return;
        }
        setOpen(computeIsOpenNow(body.data));
      } catch {
        /* keep SSR / previous value */
      }
    };

    void run();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <p className={`home-open-status ${open ? "open" : "closed"}`}>
      <span className="home-open-status-dot" />
      {open ? openLabel : closedLabel}
    </p>
  );
}
