import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tláloc Restaurant",
    short_name: "Tláloc",
    description:
      "Mexican restaurant in Lisbon (Alcântara): tacos, margaritas, homestyle Mexican food and reservations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#130800",
    theme_color: "#130800",
    icons: [
      {
        src: `${getSiteBaseUrl()}/icon-192-v2.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${getSiteBaseUrl()}/icon-512-v2.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${getSiteBaseUrl()}/apple-touch-icon-v2.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
