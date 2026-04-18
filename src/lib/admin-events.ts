type AdminEventType = "reservation_created";

export type AdminEvent = {
  type: AdminEventType;
  reservationId: string;
  reservationVersion: "v1" | "v2";
  guestName: string;
  date: string;
  time: string;
  createdAt: string;
};

type AdminEventListener = (event: AdminEvent) => void;

const globalForAdminEvents = globalThis as typeof globalThis & {
  __tlalocAdminEventListeners?: Set<AdminEventListener>;
};

const listeners =
  globalForAdminEvents.__tlalocAdminEventListeners ??
  (globalForAdminEvents.__tlalocAdminEventListeners = new Set<AdminEventListener>());

export const subscribeToAdminEvents = (listener: AdminEventListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishAdminEvent = (event: AdminEvent): void => {
  for (const listener of listeners) {
    listener(event);
  }
};
