# Element Quest — Claude Code Reference

> Periodic table memory game for kids and parents.
> Built in React. Goal: run locally → deploy to internet.

---

## Current Status

| Phase | Status |
|-------|--------|
| Core game (React artifact) | ✅ Done |
| Local dev setup (Vite)     | ✅ Done |
| Deploy (Vercel)            | ✅ Live — https://periodic-table-game-murex.vercel.app |
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
├── HomeScreen       — player select, difficulty, mode select
├── FlashcardMode    — flip cards, self-grade Got it / Study More
├── QuizMode         — 10 questions, 4-choice symbol pick, streak bonus
├── ScrambleMode     — 8 questions, type element name given symbol
├── SpeedMode        — 60s timer, rapid 4-choice quiz
└── ResultsScreen    — star rating, scoreboard, play again
```

**Key state patterns:**
- `scoreRef` (useRef) used inside async callbacks to avoid stale closure bugs
- `key={gameKey}` on game components forces full remount between rounds
- `usePlayers()` hook manages player list + scores via localStorage (`eq_players`, `eq_scores`)
- Player objects: `{ id, name, age, icon, color }` — icon from `PLAYER_ICONS[]`, color from `PLAYER_COLORS[]`

**Data:**
- 47 elements in `ELEMENTS[]`, each with `{ name, symbol, number, group, tier }`
- `tier: 1` = easy (15 elements), `tier: 2` = medium (+16), `tier: 3` = hard (+16)
- Group colors in `GC` object — each element group has a distinct neon color

---

## Planned Improvements (tackle in order)

- [ ] **Custom domain** — `vercel domains add <domain>` once a domain is ready
- [ ] **More elements** — extend to all 118 with tier 4
- [ ] **Atomic number quiz** — third game axis beyond name↔symbol
- [ ] **Progress tracking** — which elements each player has mastered
- [ ] **Mobile PWA** — add manifest + service worker so it installs on phone
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
- No API keys required
- No backend / database
- Works fully offline after first load (fonts require network on first visit)
