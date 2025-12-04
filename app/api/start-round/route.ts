import { NextResponse } from "next/server";
import { startRound } from "@/lib/state";

export async function POST(request: Request) {
  const body = await request.json();
  const { ticketKey, ticketTitle, playerId } = body ?? {};

  try {
    const round = startRound(ticketKey, ticketTitle, playerId);
    return NextResponse.json({ round });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start round";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
