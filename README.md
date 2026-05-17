# ⚗️ Element Quest

A periodic table memory game for kids and parents — built with React + Vite.

**Live:** https://periodic-table-game-murex.vercel.app

## Quick Start (Local)

```bash
# 1. Scaffold Vite project
npm create vite@latest element-quest -- --template react
cd element-quest

# 2. Install deps
npm install

# 3. Replace generated files with the ones from this project:
#    - Copy ElementQuest.jsx → src/App.jsx
#    - Copy index.html       → index.html  (has correct title + base styles)
#    - Copy vite.config.js   → vite.config.js
#
#    Create src/main.jsx with:
#
#      import React from 'react'
#      import ReactDOM from 'react-dom/client'
#      import App from './App.jsx'
#      ReactDOM.createRoot(document.getElementById('root')).render(
#        <React.StrictMode><App /></React.StrictMode>
#      )

# 4. Run
npm run dev
# → http://localhost:5173
```

## Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Done. Vercel auto-detects Vite — no config needed.

## Deploy to Netlify

```bash
npm run build
npm install -g netlify-cli
netlify login
netlify deploy --dir=dist --prod
```

## Game Modes

| Mode | Description |
|------|-------------|
| 🃏 Flash Cards | Flip card to reveal symbol. Self-grade. |
| ⚡ Symbol Quiz | 4-choice quiz with streak bonuses |
| 🔤 Name Scramble | Given the symbol, unscramble the element name |
| 🚀 Speed Blast | 60-second rapid-fire quiz |

## Difficulty Levels

| Level | Elements |
|-------|----------|
| ⭐ Starter | 15 most common (H, O, Au, Fe…) |
| ⭐⭐ Explorer | 31 elements |
| ⭐⭐⭐ Expert | Tricky transition metals etc. |
| 🔥 Legend | All 47 elements |

## Players

Multiple players are supported. Each player has a name, optional age, and one of 10 preset icons. Scores persist across sessions via localStorage.

## Roadmap

- [ ] CI/CD — connect GitHub to Vercel for auto-deploy on push
- [ ] Custom domain
- [ ] All 118 elements (tier 4)
- [ ] Atomic number quiz mode
- [ ] Per-player element mastery tracking
- [ ] Mobile PWA (installable)

## Tech

- React 18, Vite 5
- No CSS framework — all inline styles
- No backend, no database
- Google Fonts: Exo 2 + Nunito
