"use client";

import { useEffect, useMemo, useState } from "react";
import { GameState, Player, VoteValue } from "@/lib/types";

const POLL_INTERVAL = 3000;

type StateResponse = {
  state: GameState;
  voteStatus?: { votes: number; totalPlayers: number } | null;
  deck: VoteValue[];
};

const STORAGE_KEY = "scrum-poker-player";

function formatStatus(state: GameState | null) {
  if (!state?.currentRound) return "Waiting for the host to start a round";
  if (state.currentRound.status === "voting") return "Voting in progress";
  if (state.currentRound.status === "revealed") return "Cards revealed";
  return "Idle";
}

function calculateAverage(votes: { value: VoteValue }[]) {
  const numeric = votes
    .map((vote) => Number(vote.value))
    .filter((value) => !Number.isNaN(value));
  if (!numeric.length) return null;
  const total = numeric.reduce((sum, current) => sum + current, 0);
  return Number((total / numeric.length).toFixed(2));
}

export default function Home() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [deck, setDeck] = useState<VoteValue[]>([]);
  const [name, setName] = useState("");
  const [ticketKey, setTicketKey] = useState("ABC-123");
  const [ticketTitle, setTicketTitle] = useState("Story title");
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const revealed = state?.currentRound?.status === "revealed";
  const currentRound = state?.currentRound;

  const average = useMemo(
    () => (currentRound ? calculateAverage(currentRound.votes) : null),
    [currentRound]
  );

  const myVote = useMemo(() => {
    if (!currentRound || !player) return null;
    return currentRound.votes.find((vote) => vote.playerId === player.id) ?? null;
  }, [currentRound, player]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Player = JSON.parse(saved);
      setPlayer(parsed);
      setName(parsed.name);
      fetchState(parsed.id).catch(() => undefined);
    } else {
      fetchState().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchState(player?.id).catch(() => undefined);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [player?.id]);

  useEffect(() => {
    if (!currentRound) {
      setSelectedVote(null);
      return;
    }
    if (myVote) {
      setSelectedVote(myVote.value);
    }
  }, [currentRound, myVote]);

  const fetchState = async (playerId?: string) => {
    const query = playerId ? `?playerId=${playerId}` : "";
    const res = await fetch(`/api/state${query}`, { cache: "no-store" });
    if (!res.ok) return;
    const data: StateResponse = await res.json();
    setState(data.state);
    setDeck(data.deck);
  };

  const join = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, playerId: player?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to join");
      setPlayer(data.player);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.player));
      await fetchState(data.player.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join";
      setMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const startRound = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!player) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketKey, ticketTitle, playerId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to start round");
      setSelectedVote(null);
      await fetchState(player.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start round";
      setMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const castVote = async (value: VoteValue) => {
    if (!player || state?.currentRound?.status !== "voting") return;
    setSelectedVote(value);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, value }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Unable to vote");
    } else {
      await fetchState(player.id);
    }
  };

  const revealCards = async () => {
    if (!player) return;
    const res = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Unable to reveal");
    } else {
      await fetchState(player.id);
    }
  };

  const resetRound = async () => {
    if (!player) return;
    const res = await fetch("/api/reset-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Unable to reset");
    } else {
      setSelectedVote(null);
      await fetchState(player.id);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <p className="uppercase text-sm tracking-widest text-gold">Scrum Poker</p>
          <h1 className="text-4xl font-black leading-tight">
            Poker night for sprint planning
          </h1>
          <p className="text-white/70 max-w-2xl">
            Lightweight, single-room poker table. Invite your squad, start a round, and reveal the cards when everyone has voted.
          </p>
        </div>
        <div className="p-4 bg-felt rounded-xl border border-gold/60 shadow-lg shadow-black/40 min-w-[240px]">
          <p className="text-sm text-white/70">Status</p>
          <p className="text-xl font-semibold">{formatStatus(state)}</p>
          {state?.currentRound && (
            <p className="text-sm text-white/60 mt-1">
              {state.currentRound.ticketKey} · {state.currentRound.ticketTitle}
            </p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-felt to-[#0c2a20] border border-gold/40 shadow-xl shadow-black/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-white/60">Current round</p>
                {state?.currentRound ? (
                  <h2 className="text-2xl font-semibold">
                    {state.currentRound.ticketKey}
                    <span className="text-white/60 font-normal ml-2">
                      {state.currentRound.ticketTitle}
                    </span>
                  </h2>
                ) : (
                  <h2 className="text-2xl font-semibold text-white/70">
                    Waiting for the host to start a round
                  </h2>
                )}
              </div>
              {player?.isHost && (
                <div className="flex gap-2">
                  <button
                    onClick={revealCards}
                    disabled={!state?.currentRound || state.currentRound.status !== "voting"}
                    className="px-4 py-2 rounded-lg bg-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reveal
                  </button>
                  <button
                    onClick={resetRound}
                    disabled={!state?.currentRound}
                    className="px-4 py-2 rounded-lg border border-gold/60 text-gold font-semibold hover:bg-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {deck.map((value) => {
                const isSelected = selectedVote === value;
                return (
                  <button
                    key={value}
                    onClick={() => castVote(value)}
                    disabled={!state?.currentRound || state.currentRound.status !== "voting" || !player}
                    className={`p-4 poker-card ${
                      isSelected ? "glow-ring" : ""
                    } flex flex-col items-center justify-center text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-3xl">{value}</span>
                    <span className="text-xs text-white/60 mt-1">Fib card</span>
                  </button>
                );
              })}
            </div>

            {message && (
              <div className="mt-4 bg-red-900/50 border border-red-500/60 text-red-100 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}
          </div>

          <div className="p-6 bg-[#0d1c2b] border border-gold/30 rounded-2xl shadow-lg shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Players at the table</h3>
              <p className="text-sm text-white/60">
                {state?.players.length ?? 0} joined
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {state?.players.map((p) => {
                const vote = currentRound?.votes.find((v) => v.playerId === p.id);
                const isYou = player?.id === p.id;
                const label = revealed ? vote?.value ?? "–" : vote ? "Voted" : "Waiting";
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {p.name}
                        {p.isHost && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold/50">
                            Host
                          </span>
                        )}
                        {isYou && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/30 text-blue-100 border border-blue-500/50">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-white/60">Last seen {new Date(p.lastSeenAt).toLocaleTimeString()}</p>
                    </div>
                    <div className={`px-3 py-2 rounded-lg ${revealed ? "bg-felt" : "bg-white/10"} border border-white/10 min-w-[80px] text-center font-semibold`}>
                      {label}
                    </div>
                  </div>
                );
              })}
              {!state?.players.length && (
                <p className="text-white/60">No players yet. Join to become the host!</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-[#0d1c2b] border border-gold/30 rounded-2xl shadow-lg shadow-black/40">
            <h3 className="text-xl font-semibold mb-3">Join the table</h3>
            <form onSubmit={join} className="space-y-3">
              <label className="text-sm text-white/70 block">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lady Luck"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-gold/70 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="w-full mt-2 py-2 rounded-lg bg-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {player ? "Update name" : "Join"}
              </button>
            </form>
          </div>

          {player?.isHost && (
            <div className="p-6 bg-[#0d1c2b] border border-gold/30 rounded-2xl shadow-lg shadow-black/40">
              <h3 className="text-xl font-semibold mb-3">Host controls</h3>
              <form onSubmit={startRound} className="space-y-3">
                <div>
                  <label className="text-sm text-white/70 block">Ticket key</label>
                  <input
                    value={ticketKey}
                    onChange={(e) => setTicketKey(e.target.value)}
                    placeholder="ABC-123"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-gold/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 block">Ticket title</label>
                  <input
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Implement login flow"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-gold/70 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-gold to-yellow-300 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start new round
                </button>
              </form>
              <div className="mt-4 text-sm text-white/60">
                The first player to join is the host. Starting a new round clears existing votes.
              </div>
            </div>
          )}

          <div className="p-6 bg-[#0d1c2b] border border-gold/30 rounded-2xl shadow-lg shadow-black/40 space-y-2">
            <h3 className="text-xl font-semibold">Round summary</h3>
            <p className="text-white/70">
              {revealed && currentRound
                ? "Cards are on the table. Discuss the spread and pick the best estimate."
                : "Votes stay hidden until the host hits Reveal."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60">Votes cast</p>
                <p className="text-2xl font-semibold">
                  {currentRound ? currentRound.votes.length : 0} / {state?.players.length ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-white/60">Average</p>
                <p className="text-2xl font-semibold">{average ?? "–"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
