import { NextResponse } from "next/server";
import { castVote } from "@/lib/state";

export async function POST(request: Request) {
  const body = await request.json();
  const { playerId, value } = body ?? {};

  try {
    castVote(playerId, value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cast vote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
