import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { deleteRedeemedRewardCodes, listRewardCodes } from "@/lib/reward-store";

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await listRewardCodes();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load reward codes." }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedCount = await deleteRedeemedRewardCodes();
    return NextResponse.json({ data: { deletedCount } });
  } catch {
    return NextResponse.json({ error: "Could not clean redeemed reward codes." }, { status: 500 });
  }
}
