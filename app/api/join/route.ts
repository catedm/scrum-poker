import { NextResponse } from "next/server";
import { joinPlayer } from "@/lib/state";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, playerId } = body ?? {};

  try {
    const player = joinPlayer(name, playerId);
    return NextResponse.json({ player });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
