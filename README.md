# أجوبة مضحكة — Funny Answers

A local multiplayer party game (Arabic, RTL). 3–10 players on the same Wi‑Fi, each on their phone.

## Run (development)

```bash
npm install
npm run dev
```

- Open `http://localhost:5173` on your computer.
- Friends on the same Wi‑Fi open `http://<your-LAN-IP>:5173` (Vite prints the Network URL).
- The game server runs on port 3001; Vite proxies to it.

## Run (production build, one port)

```bash
npm run build
npm start
```
Then open `http://<your-LAN-IP>:3001`.

## How a round works

1. A random host (rotating) picks a question from the bank or writes one.
2. Everyone else answers before the timer runs out.
3. Answers are shuffled so nobody reads their own; each reader reveals theirs on all screens.
4. Everyone (host included) votes for one answer, never their own. 1 vote = 1 point to the author.
5. Leaderboard, next round. After the last round: podium of the top 3.

## Structure

- `server/game.js` — room state machine (`LOBBY → PICK_QUESTION → ANSWERING → REVEAL → VOTING → ROUND_RESULTS → FINAL`), all rules and timers.
- `server/index.js` — Express + Socket.IO; sends each player their own filtered view of the state.
- `server/questions.js` — Arabic question bank.
- `client/src/screens/*` — one React screen per phase.

State is in memory: restarting the server ends all rooms. Refreshing a phone rejoins the same room automatically.
