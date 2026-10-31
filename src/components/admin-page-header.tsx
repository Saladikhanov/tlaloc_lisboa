"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function getLisbonCurrentTimeLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function AdminPageHeader() {
  const searchParams = useSearchParams();
  const isTodayView = searchParams.get("tab") === "today";
  const [currentTimeLabel, setCurrentTimeLabel] = useState("");
  const headerTransition = { duration: 0.18, ease: "easeOut" as const };

  useEffect(() => {
    if (!isTodayView) {
      return;
    }

    const updateTime = () => {
      setCurrentTimeLabel(getLisbonCurrentTimeLabel());
    };

    updateTime();
    const intervalId = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(intervalId);
  }, [isTodayView]);

  return (
    <motion.div layout transition={headerTransition}>
      <AnimatePresence mode="wait" initial={false}>
        {isTodayView ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={headerTransition}
          >
            <div className="admin-legacy admin-legacy--bar">
              <h1 className="admin-page-title-today">
                <span>TODAY</span>
                <span className="admin-page-title-today-time" suppressHydrationWarning>
                  {currentTimeLabel}
                </span>
              </h1>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={headerTransition}
          >
            <h1 className="visually-hidden">Back office</h1>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
