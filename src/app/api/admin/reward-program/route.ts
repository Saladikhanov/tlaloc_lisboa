import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import {
  getRewardProgramSettings,
  syncRewardCodesForAllGuests,
  updateRewardProgramSettings,
} from "@/lib/reward-store";
import type { RewardType } from "@/lib/types";

type UpdateRewardProgramPayload = {
  isEnabled?: unknown;
  visitThreshold?: unknown;
  rewardType?: unknown;
  rewardValue?: unknown;
  rewardLabel?: unknown;
  messageEn?: unknown;
  messagePt?: unknown;
};

const rewardTypes = new Set<RewardType>(["percent", "fixed_amount", "free_item", "custom"]);

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getRewardProgramSettings();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load reward settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as UpdateRewardProgramPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const visitThreshold = Number(payload.visitThreshold);
  const rewardType = typeof payload.rewardType === "string" ? (payload.rewardType as RewardType) : null;
  const rewardValue = typeof payload.rewardValue === "string" ? payload.rewardValue.trim() : "";
  const rewardLabel = typeof payload.rewardLabel === "string" ? payload.rewardLabel.trim() : "";

  if (!Number.isFinite(visitThreshold) || visitThreshold < 1) {
    return NextResponse.json({ error: "Visit threshold must be at least 1." }, { status: 400 });
  }

  if (!rewardType || !rewardTypes.has(rewardType)) {
    return NextResponse.json({ error: "Invalid reward type." }, { status: 400 });
  }

  if (!rewardValue || !rewardLabel) {
    return NextResponse.json({ error: "Reward value and label are required." }, { status: 400 });
  }

  try {
    const data = await updateRewardProgramSettings({
      isEnabled: Boolean(payload.isEnabled),
      visitThreshold,
      rewardType,
      rewardValue,
      rewardLabel,
      messageEn: typeof payload.messageEn === "string" ? payload.messageEn : undefined,
      messagePt: typeof payload.messagePt === "string" ? payload.messagePt : undefined,
    });
    await syncRewardCodesForAllGuests();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not save reward settings." }, { status: 500 });
  }
}
