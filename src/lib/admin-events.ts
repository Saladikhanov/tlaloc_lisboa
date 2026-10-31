export type AdminEvent = {
  type: "reservation_created";
  reservationId: string;
  reservationVersion: "v1" | "v2";
  guestName: string;
  date: string;
  time: string;
  createdAt: string;
};
