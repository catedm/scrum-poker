import { FIB_DECK } from "./constants";
import { GameState, Player, RoundState, VoteValue } from "./types";

const MINUTE = 60 * 1000;
const STALE_THRESHOLD = 5 * MINUTE;

const initialState: GameState = {
  deckType: "fib",
  players: [],
  currentRound: null,
};

let gameState: GameState = { ...initialState };

function pruneStalePlayers(now = Date.now()) {
  const before = gameState.players.length;
  gameState.players = gameState.players.filter(
    (player) => now - Date.parse(player.lastSeenAt) < STALE_THRESHOLD
  );

  if (before !== gameState.players.length && gameState.currentRound) {
    const activeIds = new Set(gameState.players.map((p) => p.id));
    gameState.currentRound.votes = gameState.currentRound.votes.filter((vote) =>
      activeIds.has(vote.playerId)
    );
  }
}

export function getState(playerId?: string): GameState {
  if (playerId) {
    const player = gameState.players.find((p) => p.id === playerId);
    if (player) {
      player.lastSeenAt = new Date().toISOString();
    }
  }

  pruneStalePlayers();
  return gameState;
}

export function joinPlayer(name: string, playerId?: string): Player {
  pruneStalePlayers();
  if (!name.trim()) {
    throw new Error("Name is required");
  }

  const now = new Date().toISOString();
  if (playerId) {
    const existing = gameState.players.find((p) => p.id === playerId);
    if (existing) {
      existing.name = name;
      existing.lastSeenAt = now;
      return existing;
    }
  }

  const isFirst = gameState.players.length === 0;
  const newPlayer: Player = {
    id: crypto.randomUUID(),
    name,
    isHost: isFirst,
    lastSeenAt: now,
  };
  gameState.players.push(newPlayer);
  return newPlayer;
}

export function startRound(
  ticketKey: string,
  ticketTitle: string,
  playerId: string
): RoundState {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player?.isHost) {
    throw new Error("Only the host can start a round");
  }

  if (!ticketKey.trim() || !ticketTitle.trim()) {
    throw new Error("Ticket key and title are required");
  }

  const newRound: RoundState = {
    ticketKey,
    ticketTitle,
    status: "voting",
    votes: [],
  };

  gameState.currentRound = newRound;
  return newRound;
}

export function castVote(playerId: string, value: VoteValue) {
  if (!gameState.currentRound || gameState.currentRound.status !== "voting") {
    throw new Error("Voting is not currently active");
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error("Player not found");
  }

  player.lastSeenAt = new Date().toISOString();
  const votes = gameState.currentRound.votes;
  const existing = votes.find((v) => v.playerId === playerId);
  if (existing) {
    existing.value = value;
  } else {
    votes.push({ playerId, value });
  }
}

export function revealRound(playerId: string) {
  if (!gameState.currentRound) {
    throw new Error("No active round");
  }
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player?.isHost) {
    throw new Error("Only the host can reveal votes");
  }

  gameState.currentRound.status = "revealed";
}

export function resetRound(playerId: string) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player?.isHost) {
    throw new Error("Only the host can reset");
  }

  gameState.currentRound = null;
}

export function getAverages() {
  const round = gameState.currentRound;
  if (!round || round.votes.length === 0) return null;
  const numericVotes = round.votes
    .map((vote) => Number(vote.value))
    .filter((value) => !isNaN(value));

  if (!numericVotes.length) return null;
  const sum = numericVotes.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / numericVotes.length;
  return Number(avg.toFixed(2));
}

export function resetAll() {
  gameState = { ...initialState };
}

export function getVoteStatus() {
  if (!gameState.currentRound) return null;
  const totalPlayers = gameState.players.length;
  const votes = gameState.currentRound.votes.length;
  return { votes, totalPlayers };
}

export function maskVotes() {
  if (!gameState.currentRound) return [];
  return gameState.currentRound.votes.map((vote) => ({
    ...vote,
    value: gameState.currentRound?.status === "revealed" ? vote.value : ("?" as VoteValue),
  }));
}

export function getDeckValues(): VoteValue[] {
  return FIB_DECK;
}
