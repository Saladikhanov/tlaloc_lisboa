/** "1 guest", "4 guests", "6+ guests": the number as entered, with the right word. */
export const formatGuests = (guests: string): string => (guests.trim() === "1" ? "1 guest" : `${guests} guests`);
