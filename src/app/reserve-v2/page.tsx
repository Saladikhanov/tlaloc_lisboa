import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootReserveV2Page() {
  redirect(`/${routing.defaultLocale}/reserve-v2`);
}
