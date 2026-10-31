import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminBackOffice from "@/components/admin-back-office";
import AdminPageHeader from "@/components/admin-page-header";
import AdminShell from "@/components/admin-shell";
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
      <AdminShell />

      <main className="site-shell form-shell">
        <AdminPageHeader />
        <AdminBackOffice />
      </main>
    </>
  );
}
