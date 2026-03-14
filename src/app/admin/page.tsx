import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminBackOffice from "@/components/admin-back-office";
import AdminTopNav from "@/components/admin-top-nav";
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";

export const metadata = {
  title: "Back Office",
  description: "Internal back office placeholder for reservation management.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminTopNav />

      <main className="site-shell form-shell">
        <h1>Back Office (MVP)</h1>
        <p className="footer-note">
          Manage reservations, menu configuration, and admin security.
        </p>
        <AdminBackOffice />
      </main>
    </>
  );
}
