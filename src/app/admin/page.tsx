import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminBackOffice from "@/components/admin-back-office";
import AdminTopNav from "@/components/admin-top-nav";
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";

export const metadata = {
  title: "Back Office",
  description: "Internal back office placeholder for reservation management.",
};

function getLisbonCurrentTimeLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tabParam = Array.isArray(resolvedSearchParams?.tab)
    ? resolvedSearchParams?.tab[0]
    : resolvedSearchParams?.tab;
  const isTodayView = tabParam === "today";
  const currentTimeLabel = isTodayView ? getLisbonCurrentTimeLabel() : null;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminTopNav />

      <main className="site-shell form-shell">
        <h1 className={isTodayView ? "admin-page-title-today" : undefined}>
          {isTodayView ? (
            <>
              <span>TODAY</span>
              <span className="admin-page-title-today-time">{currentTimeLabel}</span>
            </>
          ) : (
            "Back Office (MVP)"
          )}
        </h1>
        {!isTodayView ? (
          <p className="footer-note">
            Manage reservations, menu configuration, and admin security.
          </p>
        ) : null}
        <AdminBackOffice />
      </main>
    </>
  );
}
