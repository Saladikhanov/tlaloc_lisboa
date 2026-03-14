import { NextResponse } from "next/server";
import { listWorkingHours } from "@/lib/working-hours-store";

export async function GET() {
  try {
    const data = await listWorkingHours();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load working hours." }, { status: 500 });
  }
}
