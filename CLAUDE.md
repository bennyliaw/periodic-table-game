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
├── ScrambleMode        — 10 questions, drag tiles to unscramble element name (or type it)
├── SpeedMode           — 30s timer, rapid 4-choice quiz
├── PromotionTrialMode  — outer wrapper; holds attemptKey for retries
├── TrialGame           — 60s TNT fuse, 30 questions (Types A/B/C), grade → unlock
└── ResultsScreen       — star rating, scoreboard, play again
```

**Key state patterns:**
- `scoreRef` (useRef) used inside async callbacks to avoid stale closure bugs
- `key={gameKey}` on game components forces full remount between rounds
- `usePlayers()` hook manages player list + scores via Supabase (`eq_players` table)
- Player objects: `{ id, name, age, icon, color, score, mastered_elements, is_admin, constellation_hash, auth_reset, highest_level, unlocked_levels, training_passes, trial_grades }` — icon from `PLAYER_ICONS[]`, color from `PLAYER_COLORS[]`
- `mastered_elements` is a `jsonb` array of element symbols (e.g. `["H","O","Fe"]`) stored on the player row
- `highest_level` is a difficulty ID string (`"lv1"`–`"lv6"`) — the highest level ever completed/quit by this player; shown as rank badge on their chip; `null` = 🧹 Chore Boy (never played)

**HomeScreen floating background animation:**
- 30 fixed slots, each with `{ el, phase, cycleKey, tx, ty }` — phase state machine: `"idle"` | `"out"` | `"in"` | `"wiggle"`
- Three-layer div structure: outer (fixed anchor position + opacity fade), middle (JS-driven tx/ty wander with CSS transition), inner (keyed by `cycleKey` — wild rotate/scale animation or shake)
- **Wild animations** (`wild0`–`wild7`): rotation + scale only, no translate — translate lives in the middle div so shake runs from the wandered position
- **Mount**: slots initialize as `phase:"in"` and stagger to `"idle"` within 400ms — elements floatIn on first render; initial positions spread across full screen
- **Cycle**: 2 elements swap (fade out → new element floatIn) every 2s
- **Wander**: 6 random idle slots get new `tx`/`ty` every 2.5s; CSS `transition: transform 8s ease-in-out` on middle div makes movement slow and smooth
- **Level-switch**: each element shakes individually (random 0–180ms stagger), all fade out at 650ms, new elements stagger in from 1050ms
- `dly = 0` on wild animation — all elements start dancing immediately on mount; no stagger delay
- `slotsRef` / `difficultyRef` (useRef synced via useEffect) avoid stale closures in setInterval callbacks
- Opacity: `0.25` when visible, `0` when fading out

**PWA update prompt:**
- `registerType: 'prompt'` in `vite.config.js` — new SW waits instead of auto-applying
- `useRegisterSW` from `virtual:pwa-register/react` in `ElementQuest` root
- `handleUpdateDetected()` is called by both `onNeedRefresh` and `onRegistered` (checks `r.waiting` on mount so banner reappears after dismiss + refresh)
- **Standalone (installed PWA):** shows `UpdateBanner` (full-screen blocking modal with backdrop blur); "Update Now" calls `updateServiceWorker(true)` → reloads; "Later" dismisses
- **Browser (non-installed):** `setPendingUpdate(true)` → `useEffect` → `updateServiceWorker(true)` auto-applies silently
- `onRegistered` sets up 5-minute poll (`r.update()`) and a `visibilitychange` listener to check for updates when the app is brought back to the foreground (Android PWA resume)
- Before each deploy: update `public/release-notes.json` — always include BOTH top-level `heading`/`notes` (for old SW still running during update) AND a `sections` array (for new code); old SW reads flat fields, new SW reads `sections`

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
- Mastery is global (by symbol), not per-difficulty — mastering H at Cadet carries over to Petty Officer and above

**Difficulty levels (`LEVELS` array + `DIFF_MULT`):**
- IDs: `lv1`–`lv6` (extensible — future admirals would be `lv7`+)
- Labels follow One Piece Marine ranks: 🥉 Cadet · 🥈 Petty Officer · 🥇 Warrant Officer · 🏆 Lieutenant · 👑 Captain · ⚛️ Commodore
- `DIFF_MULT = { lv1: 0.2, lv2: 0.4, lv3: 0.6, lv4: 1.0, lv5: 1.3, lv6: 1.5 }`
- Pool sizes: lv1=15 (tier 1), lv2=31 (tiers 1-2), lv3=16 (tier 3 only), lv4=47 (tiers 1-3), lv5=82 (tiers 1-4), lv6=118 (all)
- `getLevelInfo(id)` — returns the LEVELS entry for a given ID
- Rank selection row shows **3 cards** per screen width (`flex: "0 0 calc((100% - 20px) / 3)"`); scrollable to reach all 6; badges show full text ("15 elements", "฿ 2/card")

**Scoring (Berry ฿ currency):**
- `DIFF_MULT[difficulty]` multiplier applied to all earned points in Quiz, Scramble, and Speed Blast; Flash Cards unaffected
- Points are `Math.round(base * DIFF_MULT[difficulty])` — base is 10 per correct answer (+2 per streak level in Quiz/Speed)
- `fmtBerry(n, prefix=true)` — formats score as `฿ 1.5k` / `฿ 30k`; use `prefix=false` when ฿ symbol already appears nearby
- Quitting mid-round awards the accumulated score via `quitRound(earned)` (saves to Supabase and goes home); `onQuit` prop on Quiz/Scramble/Speed, separate from `onHome` which is used for pre-game back buttons
- `pendingRef` in QuizMode and ScrambleMode cancels the post-answer setTimeout on unmount — prevents stale `onEnd` from firing and double-saving after a quit
- `updateScore(id, earned, newHighestLevel)` — also updates `highest_level` if `newHighestLevel` is higher than current
- Promotion Trial questions score Type A/B = 5 pts each, Type C (type-in) = 15 pts each; trial score does NOT add to player total
- First-time unlock bonuses added to player total via `unlockLevel()`: lv3=10k, lv4=25k, lv5=50k, lv6=100k

**Training grades:**
- `trainingGradeFromAccuracy(correct, total)` — 60%→🔵 Pass, 80%→💜 Merit, 90%→💫 Distinction
- `makeEndRound(modeKey)` factory wires grade saving for all 4 training modes; FlashcardMode uses `flashcardQuit` for quit path (grade saved on quit, unlike other modes)
- `saveTrainingPass(id, levelId, mode, grade)` — only upgrades, never downgrades stored grade
- `promotionPrereqsMet(player, targetLevelId)` — requires 75% mastery of pool level + Pass in all 4 modes at that level

**Promotion Trial:**
- `generateTrialQuestions(pool)` — 30 questions: 5–8 Type C (type symbol), rest split A/B equally (min 5 each)
- Type A: symbol shown → pick element name; Type B: name shown → pick symbol; Type C: name shown → type symbol
- `calcTrialGrade(correct, score, maxScore)` — distinction≥28 correct + 92%, merit≥24+80%, pass≥20+60%
- Auto-submit in Type C when `typedInput.length === el.symbol.length` (handles 1-char symbols like H, O, C)
- `PromotionTrialMode` holds `attemptKey` state; `TrialGame key={attemptKey}` remounts on retry
- `wasUnlocked` captured at render time in App router and passed as prop (not re-derived after Supabase update)

**Data:**
- 118 elements in `ELEMENTS[]`, each with `{ name, symbol, number, group, tier }`
- `tier: 1` = 15 elements, `tier: 2` = +16, `tier: 3` = +16, `tier: 4` = +35 ("known but uncommon"), `tier: 5` = +36 ("obscure/synthetic")
- Group colors in `GC` object — includes `lanthanide` (#fb7185) added for tier 4/5 elements
- ScrambleMode tile size is adaptive: `width: 28, fontSize: 13` for names > 9 chars; `34/16` otherwise

---

## Planned Improvements (tackle in order)

- [x] **Custom domain** — live at https://elements.demo.agentic-blueprint.com
- [x] **Mobile PWA** — installable on Android via Chrome/Brave; iOS via Safari; update prompt with release notes
- [x] **All 118 elements** — tiers 1–5, 6 difficulty levels (lv1 Cadet → lv6 Commodore), One Piece Marine rank system
- [x] **Rank badge on player chip** — 🧹 Chore Boy → 🥉🥈🥇🏆👑⚛️ based on `highest_level` field
- [x] **Supabase migration** — `highest_level text` and `last_active timestamptz` columns added to `eq_players`
- [ ] **Consider: lv3 Warrant Officer pool** — currently tier 3 only (16 elements, specialist track); consider whether it should be cumulative tiers 1–3 like Lieutenant. Revisit after kids play it.
- [x] **Level unlock system** — lv3–lv6 locked; unlock via Promotion Trial (30 questions, 60s). Training badges (🔵💜💫) tracked per mode per level. Supabase columns: `unlocked_levels`, `training_passes`, `trial_grades` (jsonb). Unlock bonuses: lv3=+10k, lv4=+25k, lv5=+50k, lv6=+100k Berry. Berry (฿) replaces "pts" in all UI. Speed Blast 30s; Scramble 10 questions. Prereqs: 75% pool mastery + Pass in all 4 modes at previous level.
- [ ] **Atomic number quiz** — third game axis beyond name↔symbol
- [ ] **Multiplayer** — real-time head-to-head via a simple WebSocket server

---

## Common Claude Code Tasks

**"Add a new player field (e.g. avatar)"**
→ Extend the player object in `usePlayers()` and the `AddPlayerModal` form. Player data lives in the `eq_players` Supabase table.

**"Add a new game mode"**
→ Add a new component (follow the pattern of QuizMode), add it to the mode list in HomeScreen, and route it in the App render block.

**"Change the color scheme"**
→ Edit the `GC` object at the top of App.jsx. Each key is an element group name, value is a hex color.

**"Add more elements"**
→ Append to the `ELEMENTS` array. Set `tier: 4` for the hardest ones and add a "tier 4" option to the difficulty selector in HomeScreen.

**"Deploy to Vercel"**
→ Run `vercel --prod` from the project root. For auto-deploy on push, connect the GitHub repo in Vercel dashboard → Project Settings → Git.

---

## Advisor Usage
When the task involves:
- New feature design spanning multiple layers (DB, API, UI)
- Architectural decisions or refactoring
- Deployment or infrastructure changes
- Anything I flag as "complex" or "critical"

→ Consult the advisor before writing any code, not just when stuck.

---

## Environment

- Node.js: 18+ recommended
- Supabase env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Works fully offline after first load (fonts + Supabase require network)
