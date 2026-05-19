# ⚗️ Element Quest

A periodic table memory game for kids and parents — built with React + Vite.

**Live:** https://elements.demo.agentic-blueprint.com  
*(also available at https://periodic-table-game-murex.vercel.app)*

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

-- Flashcard mastery tracking
alter table eq_players add column mastered_elements jsonb default '[]'::jsonb;

-- Constellation auth + admin role
alter table eq_players add column is_admin boolean default false;
alter table eq_players add column constellation_hash text;
alter table eq_players add column auth_reset boolean default true;

-- Rank badge + activity tracking
alter table eq_players add column highest_level text;
alter table eq_players add column last_active timestamptz;

-- Level unlock system
alter table eq_players add column unlocked_levels jsonb default '["lv1","lv2"]'::jsonb;
alter table eq_players add column training_passes  jsonb default '{}'::jsonb;
alter table eq_players add column trial_grades     jsonb default '{}'::jsonb;
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
| ⚡ Symbol Quiz | 4-choice quiz with streak bonuses. Score multiplied by difficulty. |
| 🔤 Name Scramble | Given the symbol, drag tiles to unscramble (or type) the element name — works on mobile touch and desktop. Score multiplied by difficulty. |
| 🚀 Speed Blast | 30-second rapid-fire quiz with streak bonuses. Score multiplied by difficulty. |
| ⚔️ Promotion Trial | 60-second, 30-question gauntlet (MC + type-in) that unlocks the next rank on pass. |

Quitting a round mid-way still awards the accumulated score to the player's total.

## Difficulty Levels

| Level | Elements | Score multiplier | Unlock |
|-------|----------|-----------------|--------|
| 🥉 Cadet | 15 most common (H, O, Au, Fe…) | 0.2× | Always unlocked |
| 🥈 Petty Officer | 31 elements — noble gases, halogens, metals | 0.4× | Always unlocked |
| 🥇 Warrant Officer | 16 specialist heavy metals & transitions | 0.6× | Promotion Trial |
| 🏆 Lieutenant | 47 elements — combined tiers 1–3 | 1× | Promotion Trial |
| 👑 Captain | 82 elements — including rare metals | 1.3× | Promotion Trial |
| ⚛️ Commodore | All 118 elements — full periodic table | 1.5× | Promotion Trial |

Each rank card shows the element count and ฿ per card at a glance. The rank row shows 2.5 cards per screen — scroll to see all six.

Passing a Promotion Trial unlocks the next rank and awards a one-time Berry bonus (lv3 +฿10k → lv6 +฿100k).

## First Visit

New visitors land on a welcome screen explaining the app with two options:
- **Join a Room** — enter an existing room code (3–6 characters) to join family/friends
- **Start Fresh** — creates a new room with an auto-generated 6-character code

Returning visitors (with a prior room code in localStorage) skip straight to the game screen.

## Players

Multiple players are supported. Each player has a name, optional age, and a custom or preset icon. Players are grouped by a **room code** — anyone who opens the app with the same room code sees the same player list and scores.

### Constellation Auth

Switching to another player requires drawing their **constellation pattern** — a drag-across-stars gesture on a 12-dot star field, using 3–8 dots in sequence. The pattern is hashed with SHA-256 before being stored, so the raw sequence is never persisted.

### Admin Role

The **first player** added to a room is automatically assigned admin. Admins get a 👮 badge on their chip and a 🔒 padlock button in the top-right corner. Clicking the padlock requires re-drawing their constellation; once unlocked (5-minute window), they can:

- **Long-press any player chip** to open the management menu
- Reset another player's constellation (e.g. a kid forgot their pattern)
- Grant or revoke admin status (at least one admin must always remain)
- Delete a player from the room

If a room ends up with no admins, any active player can long-press their own chip to **claim admin**.

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
- [x] Custom domain — https://elements.demo.agentic-blueprint.com
- [x] Mobile PWA — installable on Android (Chrome/Brave); iOS via Safari; update prompt with release notes
- [x] Per-player element mastery tracking
- [x] All 118 elements across 6 difficulty levels (One Piece Marine ranks: Cadet → Commodore)
- [x] Rank badge on player chip based on highest level completed
- [x] Level unlock system — lv3–lv6 locked; earn training badges then attempt Promotion Trial to unlock
- [ ] Atomic number quiz mode
- [ ] Multiplayer — real-time head-to-head

## Tech

- React 18, Vite 5
- Supabase — player storage + real-time sync across devices
- No CSS framework — all inline styles
- Google Fonts: Exo 2 + Nunito
