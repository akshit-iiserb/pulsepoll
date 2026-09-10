# PulseRoom — Interactive Audience Engagement Platform

> Real-time polls, Q&A, and quizzes for live events. No signup required.

## Quick Start

```bash
# 1. Install dependencies (first time only)
export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh"
npm install

# 2. Set up database (first time only)
npx prisma migrate dev --name init

# 3. Start the app
npm run dev
```

App runs at **http://localhost:3000**

---

## Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page — join or create a room |
| `/room/[CODE]` | **Participant view** — mobile-first, vote & ask questions |
| `/host/[CODE]` | **Host console** — launch polls, moderate Q&A, run quiz |
| `/stage/[CODE]` | **Stage display** — projector view with charts & QR code |

---

## Features (PRD v1.0 + v1.1)

### P0 — MVP
- ✅ **6-digit room code + QR code join** — no signup, instant access
- ✅ **Session persistence** — localStorage preserves identity across reloads
- ✅ **Real-time sync** — Socket.IO with WebSocket + HTTP long-poll fallback
- ✅ **Single & multi-choice polls** with live participant count
- ✅ **Assessment polls** — host marks correct answers, revealed after lock
- ✅ **Three-phase poll workflow**: Open → Locked → Revealed
  - Phase 1: Results hidden from participants (anti-bias)
  - Phase 2: Bar charts shown to everyone
  - Phase 3: Correct answers highlighted in green
- ✅ **Live Q&A text wall** — 300-char limit, anonymous/named submissions
- ✅ **Real-time upvoting** — deduped per session, optimistic UI
- ✅ **Host moderation** — approve/reject/pin/answer/archive questions
- ✅ **Pre-moderation queue** — optional gating before Q&A goes live
- ✅ **Profanity filter** — keyword blocklist with leet-speak detection

### P1 — v1.1
- ✅ **Gamified quizzes** — countdown timer (10/20/30/60s) per question
- ✅ **Speed-based scoring** — max 1000 pts, decreases with time taken
- ✅ **Live leaderboard** — top 10 with crown/medal icons
- ✅ **Animated word cloud** — NLP key-phrase extraction from Q&A

---

## Architecture

```
Custom HTTP Server (server.ts)
├── Next.js 15 (App Router)
└── Socket.IO 4
    ├── WebSocket transport (primary)
    └── HTTP long-poll fallback

Database: SQLite (via Prisma 5)
In-memory: Participant tracking, upvote dedup, vote dedup

Routes:
  POST /api/rooms          — Create room (returns hostSecret)
  GET  /api/rooms/[code]   — Validate room code
  PATCH /api/rooms/[code]  — Update room settings (host only)
```

## Security

- **hostSecret** stored in localStorage on room creation, never exposed in URLs
- **Vote deduplication** — one vote per poll per sessionId (in-memory + DB unique constraint)
- **Upvote deduplication** — in-memory per question/session
- **Rate limiting** — 1 Q&A submission per 10 seconds per session
- **Profanity filtering** — applied before any submission is persisted

## Database Commands

```bash
npx prisma studio          # Open DB GUI at localhost:5555
npx prisma migrate dev     # Apply schema changes
npx prisma db push         # Push schema without migrations
```
