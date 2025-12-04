import { NextResponse } from "next/server";
import { getDeckValues, getState, getVoteStatus } from "@/lib/state";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId") ?? undefined;
  const state = getState(playerId);
  const status = getVoteStatus();

  return NextResponse.json({
    state,
    voteStatus: status,
    deck: getDeckValues(),
  });
}
