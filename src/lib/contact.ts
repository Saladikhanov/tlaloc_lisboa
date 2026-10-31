// Single source for public contact details that are not stored in settings.
export const LANDLINE_DISPLAY = "+351 21 809 3388";
export const LANDLINE_TEL = "+351218093388";

// Placeholder written by the settings seed; never show it to guests.
export const PLACEHOLDER_EMAIL = "reservas@tlaloc.local";

export const getPublicEmail = (email: string): string | null => {
  const value = email.trim();
  return value && value.toLowerCase() !== PLACEHOLDER_EMAIL ? value : null;
};

export const whatsappDigits = (phone: string): string => phone.replace(/[^\d]/g, "");

export const UBER_EATS_WEB_URL =
  "https://www.ubereats.com/pt-en/store/tlaloc-un-rincon-mexicana/WZywXn7kQiOh8tBFs4dwog";
