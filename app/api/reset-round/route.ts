import { NextResponse } from "next/server";
import { resetRound } from "@/lib/state";

export async function POST(request: Request) {
  const body = await request.json();
  const { playerId } = body ?? {};

  try {
    resetRound(playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
