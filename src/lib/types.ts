export type Locale = "en" | "pt";
export type ReservationLifecycleStatus = "new" | "confirmed" | "cancelled" | "no_show";
export type RewardType = "percent" | "fixed_amount" | "free_item" | "custom";
export type RewardCodeStatus = "active" | "used" | "cancelled";

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
  status: ReservationLifecycleStatus;
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
  status: ReservationLifecycleStatus;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReservationRequestPayload = ReservationV2Payload;
export type ReservationRequestRecord = ReservationV2Record;

export type RewardProgramSettingsRecord = {
  id: string;
  isEnabled: boolean;
  visitThreshold: number;
  rewardType: RewardType;
  rewardValue: string;
  rewardLabel: string;
  messageEn?: string;
  messagePt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RewardCodeRecord = {
  id: string;
  code: string;
  status: RewardCodeStatus;
  phoneKey?: string;
  emailKey?: string;
  guestName?: string;
  rewardType: RewardType;
  rewardValue: string;
  rewardLabel: string;
  messageEn?: string;
  messagePt?: string;
  generatedAfterConfirmedCount: number;
  originReservationId?: string;
  originReservationVersion?: "v1" | "v2";
  usedByReservationId?: string;
  usedByReservationVersion?: "v1" | "v2";
  usedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RewardCodeValidationResult = {
  code: RewardCodeRecord;
  isValid: boolean;
  reason?: "not_found" | "inactive" | "identity_mismatch";
};
