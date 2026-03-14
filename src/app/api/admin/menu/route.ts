import { NextResponse } from "next/server";
import { getAdminMenuData } from "@/lib/menu-store";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getAdminMenuData();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load menu configuration." }, { status: 500 });
  }
}
