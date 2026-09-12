<div align="center">

# 🔴 PulseRoom

### Live Audience Engagement — Polls · Q&A · Quizzes · Word Clouds

**Built by [CyberHeathens Coding Club](https://iiserb.ac.in) · IISER Bhopal**

*No signup. No app download. Just scan and participate.*

---

</div>

## What is PulseRoom?

PulseRoom is a real-time audience engagement platform designed for lectures, seminars, fests, and live events at IISER Bhopal — and anywhere else. A presenter (host) creates a room and gets a **6-digit code**. The audience joins instantly from any phone by visiting the link and entering the code — no login, no account, nothing to install.

Once inside, the host can:
- Launch **live polls** and see votes come in as they happen
- Run a **Q&A session** where the audience submits questions and upvotes their favourites
- Display a **live word cloud** that grows as the audience types responses
- Run a **speed-based quiz** with a live leaderboard

Everything syncs in real-time across all connected devices.

---

## Features

### 🗳️ Polls
- **Single-choice & Multi-choice** polls with live vote counts
- **Assessment polls** — host marks correct answers, revealed at the end
- **Three-phase workflow**: Open (votes hidden) → Locked (results shown) → Revealed (answers highlighted)
- Results appear as animated bar charts on the stage display

### 💬 Q&A
- Audience submits questions (up to 300 characters), named or anonymous
- **Real-time upvoting** — the best questions float to the top
- **Host moderation** — approve, pin, answer, or archive any question
- Optional **pre-moderation mode** — questions go into a queue before going public
- Built-in **profanity filter** with leet-speak detection

### ☁️ Word Cloud
- Audience types a word or short phrase; the cloud builds live
- Word size reflects frequency — the more votes a word gets, the bigger it appears
- Collision-detecting layout (no overlaps), Slido-style

### 🏆 Quiz
- Host creates a quiz with multiple questions and per-question time limits (10 / 20 / 30 / 60 seconds)
- **Speed-based scoring** — faster answers get more points (max 1000 per question)
- Live leaderboard updates after every question

### 📺 Stage Display
- A separate fullscreen projector view (`/stage/[CODE]`) shows:
  - QR code and room code for audience to join
  - Live poll results as bar charts
  - Word cloud
  - Quiz leaderboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Real-time | Pusher Channels |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Hosting | Vercel |

---

## How to Run Locally (Step by Step)

### Prerequisites
- Node.js 18 or newer
- A [Pusher](https://pusher.com) account (free tier)
- Either a local PostgreSQL install **or** a free cloud DB from [Neon](https://neon.tech)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/cyberheathens/pulsepoll.git
cd pulsepoll
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Create your environment file

```bash
cp .env.example .env
```

Now open `.env` in any text editor and fill in the values:

```env
# PostgreSQL connection string
# For local Postgres: postgresql://postgres:password@localhost:5432/pulsepoll
# For Neon (free cloud): get this from neon.tech after creating a project
DATABASE_URL="postgresql://user:password@host/dbname"

# Pusher — go to pusher.com → Create App → App Keys
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="ap2"

# These two must match the PUSHER_KEY and PUSHER_CLUSTER above
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Your local URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Getting Pusher keys:**
> 1. Sign up at [pusher.com](https://pusher.com) (free)
> 2. Click **Create App** → give it a name → choose cluster `ap2` (closest to India)
> 3. Go to **App Keys** tab → copy the four values

---

### Step 4 — Set up the database

```bash
npx prisma db push
```

This creates all the tables in your database. You only need to run this once (or again after schema changes).

---

### Step 5 — Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app is running!

---

## How to Use PulseRoom

### As a Host (Presenter)

1. Go to `http://localhost:3000`
2. Enter a room name and click **Create Room**
3. You'll be taken to the **Host Console** at `/host/[CODE]`
4. Share the room code or the QR code with your audience
5. Use the tabs to:
   - **Polls** — create and control polls
   - **Word Cloud** — launch a word cloud prompt
   - **Q&A** — view, upvote, and moderate questions
   - **Quiz** — build and run a speed quiz
   - **Room** — access the stage display link and QR code

### As a Participant (Audience)

1. Go to `http://localhost:3000`
2. Enter the 6-digit room code shared by the host
3. You're in — no login needed
4. Use the **Poll** tab to vote, and the **Q&A** tab to submit and upvote questions

### Stage Display (Projector)

- Open `/stage/[CODE]` on the projector or a second screen
- Shows live results, the word cloud, and the quiz leaderboard automatically

---

## Deploying to Vercel

### Step 1 — Get a free database (Neon)
1. Go to [neon.tech](https://neon.tech) → Sign up → **Create Project**
2. Copy the **connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)

### Step 2 — Get free Pusher credentials
1. Go to [pusher.com](https://pusher.com) → Sign up → **Create App**
2. Select **Channels**, choose a cluster
3. Go to **App Keys** — copy `app_id`, `key`, `secret`, `cluster`

### Step 3 — Push your code to GitHub

```bash
git add -A
git commit -m "ready for deployment"
git push
```

### Step 4 — Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Vercel auto-detects Next.js — no build settings needed
3. Add the following **Environment Variables** in the Vercel dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `PUSHER_APP_ID` | From Pusher dashboard |
| `PUSHER_KEY` | From Pusher dashboard |
| `PUSHER_SECRET` | From Pusher dashboard |
| `PUSHER_CLUSTER` | e.g. `ap2` |
| `NEXT_PUBLIC_PUSHER_KEY` | Same as `PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same as `PUSHER_CLUSTER` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL e.g. `https://pulsepoll.vercel.app` |

4. Click **Deploy**

### Step 5 — Run the database migration

After the first deploy, run this once to create all tables in Neon:

```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

Your app is live! 🚀

---

## App Routes

| URL | Who uses it | What it does |
|---|---|---|
| `/` | Everyone | Landing page — create or join a room |
| `/room/[CODE]` | Audience | Participant view — vote, ask questions |
| `/host/[CODE]` | Presenter | Host console — control everything |
| `/stage/[CODE]` | Projector screen | Fullscreen stage display with charts and QR |

---

## Database Commands

```bash
# View and edit data in a visual UI
npx prisma studio

# Apply schema changes (development)
npx prisma db push

# Apply migrations (production / Vercel)
npx prisma migrate deploy
```

---

## Security

- `hostSecret` is generated on room creation and stored only in the browser's `localStorage` — never in the URL
- **Vote deduplication** — one vote per poll per session, enforced at the database level
- **Upvote deduplication** — tracked in the database, prevents double-upvoting
- **Rate limiting** — max 1 Q&A submission per 10 seconds per session
- **Profanity filter** — runs on every text submission before it is saved

---

## Project Structure

```
pulsepoll/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing page
│   │   ├── room/[roomCode]/      ← Participant view
│   │   ├── host/[roomCode]/      ← Host console
│   │   ├── stage/[roomCode]/     ← Stage / projector view
│   │   └── api/
│   │       ├── rooms/            ← Room create/validate endpoints
│   │       └── socket/           ← Real-time action endpoints (Pusher)
│   ├── components/
│   │   ├── host/                 ← Host UI components
│   │   ├── participant/          ← Audience UI components
│   │   ├── stage/                ← Stage display components
│   │   └── shared/               ← QR code, shared UI
│   ├── hooks/
│   │   └── useSocket.ts          ← Pusher + fetch real-time hook
│   └── lib/
│       ├── prisma.ts             ← Database client
│       ├── pusher.ts             ← Server-side Pusher instance
│       ├── api-helpers.ts        ← Shared formatters for API routes
│       ├── types.ts              ← TypeScript types
│       └── utils.ts              ← Room code generation, word cloud NLP
├── prisma/
│   └── schema.prisma             ← Database schema
├── .env.example                  ← Environment variable template
└── vercel.json                   ← Vercel deployment config
```

---

<div align="center">

Made with ❤️ by **CyberHeathens Coding Club**

[IISER Bhopal](https://www.iiserb.ac.in) · Bhopal, India

*For seminars, fests, lectures, and everything in between.*

</div>
