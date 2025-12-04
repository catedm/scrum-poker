import { NextResponse } from "next/server";
import { revealRound } from "@/lib/state";

export async function POST(request: Request) {
  const body = await request.json();
  const { playerId } = body ?? {};

  try {
    revealRound(playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reveal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
