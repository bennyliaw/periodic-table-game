# Element Quest — Claude Code Reference

> Periodic table memory game for kids and parents.
> Built in React. Goal: run locally → deploy to internet.

---

## Current Status

| Phase | Status |
|-------|--------|
| Core game (React artifact) | ✅ Done |
| Local dev setup (Vite)     | ✅ Done |
| Deploy (Vercel)            | ✅ Live — https://elements.demo.agentic-blueprint.com |
| CI/CD (GitHub Actions)     | ✅ Auto-deploys to Vercel on every push to `main` |

---

## Stack

| Layer      | Tool |
|------------|------|
| Framework  | React 18 |
| Bundler    | Vite |
| Styling    | Inline styles + `<style>` keyframes (no CSS framework) |
| Fonts      | Google Fonts — Exo 2 + Nunito (loaded via @import) |
| Deploy     | Vercel (preferred) or Netlify |
| Package mgr| npm |

---

## Phase 1 — Run Locally

### One-time setup

```bash
npm create vite@latest element-quest -- --template react
cd element-quest
npm install
```

### Drop in the game file

Replace `src/App.jsx` with the contents of `ElementQuest.jsx`.
Delete `src/App.css` and `src/index.css` (not needed — all styles are inline).

Update `src/main.jsx` to just:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

Update `index.html` — set a title:
```html
<title>Element Quest ⚗️</title>
```

### Dev server

```bash
npm run dev
# → http://localhost:5173
```

### Build for production

```bash
npm run build
# Output: dist/
```

### Preview production build locally

```bash
npm run preview
# → http://localhost:4173
```

---

## Phase 2 — Deploy to Internet

### Option A: Vercel (recommended — zero config)

```bash
npm install -g vercel
vercel login
vercel         # follow prompts, auto-detects Vite
vercel --prod  # promote to production URL
```

Vercel auto-detects Vite. No config file needed.
Every `git push` to main will auto-deploy if you connect the repo.

### Option B: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=dist         # preview
netlify deploy --dir=dist --prod  # production
```

Add `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## Project File Map

```
element-quest/
├── CLAUDE.md          ← you are here
├── README.md          ← human-readable docs
├── package.json       ← version field = major.minor (e.g. 0.5.0)
├── vite.config.js
├── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml ← CI/CD: auto-deploy to Vercel on push to main
└── src/
    ├── main.jsx       ← React entry point
    ├── supabase.js    ← Supabase client (reads VITE_ env vars)
    └── App.jsx        ← entire game lives here
```

---

## Game Architecture (quick reference for Claude Code)

```
App (screen router + shared state)
├── LandingScreen    — first-visit only (eq_visited localStorage flag); "Join a Room" or "Start Fresh"
├── HomeScreen       — player select, difficulty, mode select
├── FlashcardMode    — 15-card sessions, "Mark done" / "Show again later", mastery tracked per player
├── QuizMode         — 10 questions, 4-choice symbol pick, streak bonus
├── ScrambleMode     — 8 questions, drag tiles to unscramble element name (or type it)
├── SpeedMode        — 60s timer, rapid 4-choice quiz
└── ResultsScreen    — star rating, scoreboard, play again
```

**Key state patterns:**
- `scoreRef` (useRef) used inside async callbacks to avoid stale closure bugs
- `key={gameKey}` on game components forces full remount between rounds
- `usePlayers()` hook manages player list + scores via Supabase (`eq_players` table)
- Player objects: `{ id, name, age, icon, color, score, mastered_elements, is_admin, constellation_hash, auth_reset }` — icon from `PLAYER_ICONS[]`, color from `PLAYER_COLORS[]`
- `mastered_elements` is a `jsonb` array of element symbols (e.g. `["H","O","Fe"]`) stored on the player row

**PWA update prompt:**
- `registerType: 'prompt'` in `vite.config.js` — new SW waits instead of auto-applying
- `useRegisterSW` from `virtual:pwa-register/react` in `ElementQuest` root
- `handleUpdateDetected()` is called by both `onNeedRefresh` and `onRegistered` (checks `r.waiting` on mount so banner reappears after dismiss + refresh)
- **Standalone (installed PWA):** shows `UpdateBanner` (full-screen blocking modal with backdrop blur); "Update Now" calls `updateServiceWorker(true)` → reloads; "Later" dismisses
- **Browser (non-installed):** `setPendingUpdate(true)` → `useEffect` → `updateServiceWorker(true)` auto-applies silently
- `onRegistered` sets up 5-minute poll (`r.update()`) and a `visibilitychange` listener to check for updates when the app is brought back to the foreground (Android PWA resume)
- Before each deploy: update `public/release-notes.json` with bullet points for what changed

**ScrambleMode drag (works on mobile + desktop):**
- Uses `onPointerMove` on the tile container + `document.elementFromPoint` to detect which tile the pointer is over — do NOT use `onPointerEnter` on tiles
- `onPointerEnter` on individual tiles causes oscillation on Android: when React re-renders and tiles reorder, Chrome fires spurious `pointerenter` on tiles that appear under the stationary pointer, reverting the reorder within the same frame
- `dragIdxRef` (useRef) shadows `dragIdx` state so `pointermove` handlers always read the latest value without stale closure issues; always capture `fromIdx = dragIdxRef.current` as a local before calling `setTiles` to avoid ref changing before React flushes
- `data-tile-idx={i}` on each tile lets `elementFromPoint` identify the target by render position
- `lastModeRef` tracks last interaction: `"drag"` (set on `pointerDown`) or `"type"` (set on input `onChange`); new card only auto-focuses the text input when `lastModeRef.current === "type"` — prevents keyboard reopening on mobile when user is in drag mode

**Onboarding:**
- `eq_visited` localStorage key gates the `LandingScreen` — absent = first visit, present = skip to HomeScreen
- `AddPlayerModal` is now 2-step: step 1 (icon + name + age), step 2 (constellation pad)
- Room code field removed from modal — handled by LandingScreen ("Join a Room" sets room before entering)
- Room codes are 3–6 chars; new auto-generated codes are always 6 chars

**Constellation auth:**
- `DOTS` — 12 fixed star positions (% coordinates) shared by all players; security comes from sequence, not position
- `hashConstellation(indices)` — SHA-256 of `JSON.stringify(indices)` via Web Crypto API; stored in `constellation_hash`
- `ConstellationPad` — drag-based SVG component; pointer events hit-test dot proximity (26px radius); trailing dashed line follows cursor while dragging
- **Auto-confirm on drag release:** `hasDraggedRef` tracks whether `pointerMove` reached a new dot; if `true` and ≥3 stars selected, `handlePointerUp` calls `submitDots(selectedRef.current)` automatically — no confirm button needed. Tap-by-tap mode still requires the Confirm button.
- `auth_reset: true` means the player skips verification on next tap and is prompted to set a new pattern
- `is_admin` — first player in room gets `true`; admin can grant/revoke for others; last admin cannot remove themselves
- Admin actions require `adminUnlocked` state (set by re-verifying constellation via padlock button, auto-locks after 5 min)
- Orphaned room (no admins): any active player can long-press their own chip to claim admin without padlock

**Flashcard mastery:**
- `getPool(difficulty)` returns the unshuffled element pool for a difficulty level
- `getFlashDeck(difficulty, masteredSymbols)` deals 15 cards — unmastered first, topped up with mastered for review
- "Mark done" adds the symbol to `mastered_elements` via `updateMastery()` and persists to Supabase
- "Show again later" re-queues the card to the end of the current session deck (+1 pt)
- Mastery is global (by symbol), not per-difficulty — mastering H in Starter carries over to Explorer

**Scoring:**
- `DIFF_MULT = { easy: 0.2, medium: 0.4, hard: 0.6, all: 1.0 }` — difficulty multiplier applied to all earned points in Quiz, Scramble, and Speed Blast; Flash Cards unaffected
- Points are `Math.round(base * DIFF_MULT[difficulty])` — base is 10 per correct answer (+2 per streak level in Quiz/Speed)
- Quitting mid-round awards the accumulated score via `quitRound(earned)` (saves to Supabase and goes home); `onQuit` prop on Quiz/Scramble/Speed, separate from `onHome` which is used for pre-game back buttons
- `pendingRef` in QuizMode and ScrambleMode cancels the post-answer setTimeout on unmount — prevents stale `onEnd` from firing and double-saving after a quit

**Data:**
- 47 elements in `ELEMENTS[]`, each with `{ name, symbol, number, group, tier }`
- `tier: 1` = easy (15 elements), `tier: 2` = medium (+16), `tier: 3` = hard (+16)
- Group colors in `GC` object — each element group has a distinct neon color

---

## Planned Improvements (tackle in order)

- [x] **Custom domain** — live at https://elements.demo.agentic-blueprint.com
- [x] **Mobile PWA** — installable on Android via Chrome/Brave; iOS via Safari; update prompt with release notes
- [ ] **More elements** — extend to all 118 with tier 4
- [ ] **Atomic number quiz** — third game axis beyond name↔symbol
- [ ] **Multiplayer** — real-time head-to-head via a simple WebSocket server

---

## Common Claude Code Tasks

**"Add a new player field (e.g. avatar)"**
→ Extend the player object in `usePlayers()` and the `AddPlayerModal` form. Player data lives in `eq_players` in localStorage.

**"Add a new game mode"**
→ Add a new component (follow the pattern of QuizMode), add it to the mode list in HomeScreen, and route it in the App render block.

**"Change the color scheme"**
→ Edit the `GC` object at the top of App.jsx. Each key is an element group name, value is a hex color.

**"Add more elements"**
→ Append to the `ELEMENTS` array. Set `tier: 4` for the hardest ones and add a "tier 4" option to the difficulty selector in HomeScreen.

**"Deploy to Vercel"**
→ Run `vercel --prod` from the project root. For auto-deploy on push, connect the GitHub repo in Vercel dashboard → Project Settings → Git.

---

## Environment

- Node.js: 18+ recommended
- Supabase env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Works fully offline after first load (fonts + Supabase require network)
