# Scrum Poker (Next.js)

Single-room, poker-themed Scrum Poker starter built with Next.js 14, TypeScript, and Tailwind CSS. The app uses a shared in-memory game state on the server and simple client polling.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 to join the table.

## Features
- Single global room with host and players tracked server-side.
- Host starts rounds with ticket key/title, everyone votes using a Fibonacci deck.
- Votes stay hidden until the host reveals the cards, with averages shown for numeric values.
- In-memory state with lightweight polling from the client (no database or realtime infra).

## Tech stack
- Next.js App Router (14+)
- TypeScript
- Tailwind CSS
