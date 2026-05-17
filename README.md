# ⚗️ Element Quest

A periodic table memory game for kids and parents — built with React + Vite.

**Live:** https://periodic-table-game-murex.vercel.app

## Quick Start (Local)

### 1. Supabase (required for player sync)

Create a free project at [supabase.com](https://supabase.com), then run this in the **SQL Editor**:

```sql
create table eq_players (
  id text primary key,
  room_id text not null,
  name text not null,
  age integer,
  icon text not null,
  color text not null,
  score integer default 0,
  created_at timestamptz default now()
);

alter table eq_players enable row level security;
create policy "Public access" on eq_players for all using (true) with check (true);

alter publication supabase_realtime add table eq_players;

-- Flashcard mastery tracking (run after the table above)
alter table eq_players add column mastered_elements jsonb default '[]'::jsonb;
```

Then go to **Project Settings → API** and copy your Project URL and `anon public` key into a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

### 2. Install and run

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploy to Vercel (recommended)

### Auto-deploy via CI/CD (recommended)

Every push to `main` automatically deploys to Vercel via GitHub Actions (`.github/workflows/deploy.yml`).

One-time setup — add these three repository secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Create at vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Your Vercel team/org ID (from `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | Your Vercel project ID (from `.vercel/project.json`) |

The workflow also injects `VITE_APP_VERSION` as `<major.minor>.<run-number>` (e.g. `0.5.42`), sourced from `package.json`. Bump the `version` field there to change the major/minor.

### Manual deploy

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add the two Supabase env vars in **Vercel → Project Settings → Environment Variables** before deploying:

```bash
echo "https://your-project.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "eyJh..."                           | vercel env add VITE_SUPABASE_ANON_KEY production
```

Done. Vercel auto-detects Vite — no config needed.

## Deploy to Netlify

```bash
npm run build
npm install -g netlify-cli
netlify login
netlify deploy --dir=dist --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Netlify → Site Settings → Environment Variables**.

## Game Modes

| Mode | Description |
|------|-------------|
| 🃏 Flash Cards | Flip card to reveal symbol. 15-card sessions, mastery tracked per player. |
| ⚡ Symbol Quiz | 4-choice quiz with streak bonuses |
| 🔤 Name Scramble | Given the symbol, drag tiles to unscramble (or type) the element name |
| 🚀 Speed Blast | 60-second rapid-fire quiz |

## Difficulty Levels

| Level | Elements |
|-------|----------|
| ⭐ Starter | 15 most common (H, O, Au, Fe…) |
| ⭐⭐ Explorer | 31 elements |
| ⭐⭐⭐ Expert | Tricky transition metals etc. |
| 🔥 Legend | All 47 elements |

## Players

Multiple players are supported. Each player has a name, optional age, and a custom or preset icon. Players are grouped by a 6-character **room code** — anyone who opens the app with the same room code sees the same player list and scores.

## Real-time Sync

Player data and scores sync live across all open browsers in the same room via **Supabase Realtime**.

When a score is written to the `eq_players` table, Postgres emits a change event through its internal `NOTIFY` system. Supabase captures this and immediately pushes it over a persistent WebSocket connection to every browser currently subscribed to that room. There is no polling — the push is proactive and typically arrives in under a second.

In the code, `usePlayers()` opens one WebSocket channel per room on mount:

```js
supabase.channel(`room:${roomId}`)
  .on("postgres_changes", { event: "*", table: "eq_players", filter: `room_id=eq.${roomId}` },
    ({ eventType, new: next, old }) => { /* update local React state */ })
  .subscribe();
```

Any INSERT (new player) or UPDATE (score change) in that room is broadcast to all subscribers instantly, keeping every device in sync without a page refresh.

## Roadmap

- [x] CI/CD — GitHub Actions auto-deploys to Vercel on every push to `main`
- [ ] Custom domain
- [ ] All 118 elements (tier 4)
- [ ] Atomic number quiz mode
- [ ] Per-player element mastery tracking
- [ ] Mobile PWA (installable)

## Tech

- React 18, Vite 5
- Supabase — player storage + real-time sync across devices
- No CSS framework — all inline styles
- Google Fonts: Exo 2 + Nunito
