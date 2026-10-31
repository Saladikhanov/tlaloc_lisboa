import {
  LANDLINE_DISPLAY,
  UBER_EATS_WEB_URL,
  getPublicEmail,
  whatsappDigits,
} from "@/lib/contact";
import { getSiteBaseUrl } from "@/lib/site-url";
import { listTutorialSettings } from "@/lib/tutorial-settings-store";
import {
  listWorkingHours,
  type WorkingHoursRecord,
} from "@/lib/working-hours-store";

// Hours and contact come from the admin settings, so the file is rebuilt at most once an hour.
export const revalidate = 3600;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

const formatRange = (
  open: string | null,
  close: string | null,
): string | null => (open && close ? `${open}–${close}` : null);

const formatDay = (entry: WorkingHoursRecord | undefined): string => {
  if (!entry || entry.isClosed) {
    return "closed";
  }
  const ranges = [
    formatRange(entry.lunchOpen, entry.lunchClose),
    formatRange(entry.dinnerOpen, entry.dinnerClose),
  ].filter(Boolean);
  return ranges.length > 0 ? ranges.join(", ") : "closed";
};

export async function GET() {
  const base = getSiteBaseUrl();
  const [hours, contact] = await Promise.all([
    listWorkingHours(),
    listTutorialSettings(),
  ]);
  const email = getPublicEmail(contact.businessEmail);
  const whatsapp = whatsappDigits(contact.businessPhone);

  const lines = [
    "# Tláloc",
    "",
    "> Tláloc is a Mexican restaurant in Alcântara, Lisbon, Portugal: tacos, margaritas and homestyle Mexican cooking. The site is available in English and Portuguese, and tables can be booked online.",
    "",
    "## Key facts",
    "",
    "- Cuisine: Mexican (tacos, margaritas, comfort food)",
    "- Address: R. do Cruzeiro 1, 1300-160 Lisboa, Portugal (Alcântara)",
    "- Price: cards accepted, about €14 per person",
    "- Languages: English, Portuguese",
    "",
    "## Opening hours",
    "",
    ...MONDAY_FIRST.map(
      (weekday) =>
        `- ${DAYS[weekday]}: ${formatDay(hours.find((entry) => entry.weekday === weekday))}`,
    ),
    "",
    "Times are Lisbon time. Online bookings are only offered inside opening hours.",
    "",
    "## Pages",
    "",
    `- [Home (English)](${base}/en): about the restaurant, opening hours, location and contact`,
    `- [Home (Portuguese)](${base}/pt): the same in Portuguese`,
    `- [Menu (English)](${base}/en/menu): sections, dishes, descriptions and prices`,
    `- [Menu (Portuguese)](${base}/pt/menu): the same in Portuguese`,
    `- [Book a table (English)](${base}/en/reserve): pick a date, time and number of guests`,
    `- [Book a table (Portuguese)](${base}/pt/reserve): the same in Portuguese`,
    "",
    "## Contact and ordering",
    "",
    `- Phone: ${LANDLINE_DISPLAY}`,
    ...(whatsapp
      ? [`- WhatsApp: [${contact.businessPhone}](https://wa.me/${whatsapp})`]
      : []),
    ...(email ? [`- Email: ${email}`] : []),
    `- Delivery: [Uber Eats](${UBER_EATS_WEB_URL})`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${base}/sitemap.xml)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
