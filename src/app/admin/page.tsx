import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminBackOffice from "@/components/admin-back-office";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTopNav from "@/components/admin-top-nav";
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";

export const metadata = {
  title: "Back Office",
  description: "Internal back office placeholder for reservation management.",
};

export default async function AdminPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminTopNav />

      <main className="site-shell form-shell">
        <div className="admin-legacy admin-legacy--bar">
          <AdminPageHeader />
        </div>
        <AdminBackOffice />
      </main>
    </>
  );
}
