export type Locale = "en" | "pt";

export type LocalizedText = {
  en: string;
  pt: string;
};

export type MenuItem = {
  name: LocalizedText;
  price: string;
  description: LocalizedText;
  vegetarian?: boolean;
};

export type MenuCategory = {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  items: MenuItem[];
};

export type ReservationPayload = {
  locale: Locale;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  occasion?: string;
  notes?: string;
};

export type ReservationRecord = ReservationPayload & {
  id: string;
  isRead: boolean;
  status: "new" | "confirmed" | "cancelled";
  createdAt: string;
};

export type ReservationV2Payload = {
  locale: Locale;
  fullName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: string;
  otherInfo?: string;
};

export type ReservationV2Record = ReservationV2Payload & {
  id: string;
  isRead: boolean;
  isTest: boolean;
  status: "new" | "confirmed" | "cancelled";
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};
