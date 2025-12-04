export type VoteValue =
  | "0"
  | "0.5"
  | "1"
  | "2"
  | "3"
  | "5"
  | "8"
  | "13"
  | "?"
  | "☕";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  lastSeenAt: string;
};

export type Vote = {
  playerId: string;
  value: VoteValue;
};

export type RoundStatus = "idle" | "voting" | "revealed";

export type RoundState = {
  ticketKey: string;
  ticketTitle: string;
  status: RoundStatus;
  votes: Vote[];
};

export type GameState = {
  deckType: "fib";
  players: Player[];
  currentRound: RoundState | null;
};
