import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════
const ELEMENTS = [
  { name: "Hydrogen",   symbol: "H",  number: 1,  group: "nonmetal",        tier: 1 },
  { name: "Helium",     symbol: "He", number: 2,  group: "noble-gas",        tier: 1 },
  { name: "Carbon",     symbol: "C",  number: 6,  group: "nonmetal",        tier: 1 },
  { name: "Oxygen",     symbol: "O",  number: 8,  group: "nonmetal",        tier: 1 },
  { name: "Nitrogen",   symbol: "N",  number: 7,  group: "nonmetal",        tier: 1 },
  { name: "Gold",       symbol: "Au", number: 79, group: "metal",           tier: 1 },
  { name: "Silver",     symbol: "Ag", number: 47, group: "metal",           tier: 1 },
  { name: "Iron",       symbol: "Fe", number: 26, group: "metal",           tier: 1 },
  { name: "Copper",     symbol: "Cu", number: 29, group: "metal",           tier: 1 },
  { name: "Lead",       symbol: "Pb", number: 82, group: "metal",           tier: 1 },
  { name: "Sodium",     symbol: "Na", number: 11, group: "alkali-metal",    tier: 1 },
  { name: "Potassium",  symbol: "K",  number: 19, group: "alkali-metal",    tier: 1 },
  { name: "Calcium",    symbol: "Ca", number: 20, group: "alkaline-metal",  tier: 1 },
  { name: "Chlorine",   symbol: "Cl", number: 17, group: "halogen",        tier: 1 },
  { name: "Fluorine",   symbol: "F",  number: 9,  group: "halogen",        tier: 1 },
  { name: "Lithium",    symbol: "Li", number: 3,  group: "alkali-metal",    tier: 2 },
  { name: "Neon",       symbol: "Ne", number: 10, group: "noble-gas",        tier: 2 },
  { name: "Magnesium",  symbol: "Mg", number: 12, group: "alkaline-metal",  tier: 2 },
  { name: "Aluminum",   symbol: "Al", number: 13, group: "metal",           tier: 2 },
  { name: "Silicon",    symbol: "Si", number: 14, group: "metalloid",       tier: 2 },
  { name: "Phosphorus", symbol: "P",  number: 15, group: "nonmetal",        tier: 2 },
  { name: "Sulfur",     symbol: "S",  number: 16, group: "nonmetal",        tier: 2 },
  { name: "Argon",      symbol: "Ar", number: 18, group: "noble-gas",        tier: 2 },
  { name: "Boron",      symbol: "B",  number: 5,  group: "metalloid",       tier: 2 },
  { name: "Zinc",       symbol: "Zn", number: 30, group: "metal",           tier: 2 },
  { name: "Bromine",    symbol: "Br", number: 35, group: "halogen",        tier: 2 },
  { name: "Krypton",    symbol: "Kr", number: 36, group: "noble-gas",        tier: 2 },
  { name: "Tin",        symbol: "Sn", number: 50, group: "metal",           tier: 2 },
  { name: "Iodine",     symbol: "I",  number: 53, group: "halogen",        tier: 2 },
  { name: "Xenon",      symbol: "Xe", number: 54, group: "noble-gas",        tier: 2 },
  { name: "Mercury",    symbol: "Hg", number: 80, group: "transition-metal",tier: 2 },
  { name: "Titanium",   symbol: "Ti", number: 22, group: "transition-metal",tier: 3 },
  { name: "Chromium",   symbol: "Cr", number: 24, group: "transition-metal",tier: 3 },
  { name: "Manganese",  symbol: "Mn", number: 25, group: "transition-metal",tier: 3 },
  { name: "Cobalt",     symbol: "Co", number: 27, group: "transition-metal",tier: 3 },
  { name: "Nickel",     symbol: "Ni", number: 28, group: "transition-metal",tier: 3 },
  { name: "Barium",     symbol: "Ba", number: 56, group: "alkaline-metal",  tier: 3 },
  { name: "Tungsten",   symbol: "W",  number: 74, group: "transition-metal",tier: 3 },
  { name: "Uranium",    symbol: "U",  number: 92, group: "actinide",        tier: 3 },
  { name: "Platinum",   symbol: "Pt", number: 78, group: "transition-metal",tier: 3 },
  { name: "Beryllium",  symbol: "Be", number: 4,  group: "alkaline-metal",  tier: 3 },
  { name: "Scandium",   symbol: "Sc", number: 21, group: "transition-metal",tier: 3 },
  { name: "Vanadium",   symbol: "V",  number: 23, group: "transition-metal",tier: 3 },
  { name: "Germanium",  symbol: "Ge", number: 32, group: "metalloid",       tier: 3 },
  { name: "Arsenic",    symbol: "As", number: 33, group: "metalloid",       tier: 3 },
  { name: "Gallium",    symbol: "Ga", number: 31, group: "metal",           tier: 3 },
  { name: "Strontium",  symbol: "Sr", number: 38, group: "alkaline-metal",  tier: 3 },
  { name: "Radium",     symbol: "Ra", number: 88, group: "alkaline-metal",  tier: 3 },
];

const GC = {
  "nonmetal":         "#4ade80",
  "noble-gas":        "#a78bfa",
  "alkali-metal":     "#fb923c",
  "alkaline-metal":   "#fbbf24",
  "metalloid":        "#34d399",
  "metal":            "#60a5fa",
  "transition-metal": "#22d3ee",
  "halogen":          "#f472b6",
  "actinide":         "#f87171",
};

// ═══════════════════════════════════════════
// SOUND
// ═══════════════════════════════════════════
const PHRASES = {
  correct:  ["Great job!", "You got it!", "That's right!", "Spot on!", "Excellent work!", "Wonderful!", "You're a star!", "Nailed it!", "Brilliant thinking!", "Amazing!"],
  wrong:    ["Wrong!", "Oops!", "So close! Have another go!", "Not that, try again!", "Don't give up!", "Almost! Try again!", "Not quite, but keep going!"],
  streak3:  ["You're on a roll!", "Getting warm here!", "Keep it going!"],
  streak5:  ["You're on fire!", "Incredible! Keep it up!", "You cannot be stopped!"],
  streak7:  ["Unstoppable! This is legendary!", "You are absolutely incredible!", "Is there anything you don't know?!"],
  perfect:  ["Perfect round! Every single answer correct! You are absolutely brilliant!", "Flawless! Not a single mistake! You're a true element master!", "One hundred percent! Perfect score! Extraordinary!"],
  roundEnd: ["Well done!", "Round complete! Great effort!", "Fantastic work!"],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function useSound() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);

  function getCtx() {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  }

  function tone(freq, type, duration, start, vol = 0.25) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function speak(text, { rate = 1, pitch = 1 } = {}) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
  }

  function play(type, level = 0) {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    switch (type) {
      case "correct":
        speak(pick(PHRASES.correct), { rate: 1.0, pitch: 1.35 });
        break;
      case "wrong":
        speak(pick(PHRASES.wrong), { rate: 1.05, pitch: 1.35 });
        break;
      case "streak": {
        const milestone = level === 3 ? "Three in a row! "
                        : level === 5 ? "Five in a row! "
                        : "";
        if (level >= 7)      speak(milestone + pick(PHRASES.streak7), { rate: 1.1,  pitch: 1.65 });
        else if (level >= 5) speak(milestone + pick(PHRASES.streak5), { rate: 1.1,  pitch: 1.55 });
        else                 speak(milestone + pick(PHRASES.streak3), { rate: 1.05, pitch: 1.5  });
        break;
      }
      case "perfect":
        speak(pick(PHRASES.perfect), { rate: 1.1, pitch: 1.3 });
        [523, 659, 784, 1047].forEach((f, i) => tone(f, "sine", 0.18, t + i * 0.13, 0.2));
        break;
      case "roundEnd":
        speak(pick(PHRASES.roundEnd), { rate: 1.1, pitch: 1.3 });
        [523, 659, 784, 1047].forEach((f, i) => tone(f, "sine", 0.18, t + i * 0.13, 0.2));
        break;
      case "flip":
        tone(880, "sine", 0.06, t, 0.12);
        break;
    }
  }

  function toggleMute() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) window.speechSynthesis.cancel();
  }

  return { play, toggleMute, muted };
}

// ═══════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDeck(difficulty) {
  const pool = difficulty === "easy"   ? ELEMENTS.filter(e => e.tier === 1)
             : difficulty === "medium" ? ELEMENTS.filter(e => e.tier <= 2)
             : difficulty === "hard"   ? ELEMENTS.filter(e => e.tier === 3)
             : ELEMENTS;
  return shuffle(pool);
}

function getChoices(correct) {
  const wrong = shuffle(ELEMENTS.filter(e => e.symbol !== correct.symbol)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// ═══════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&family=Nunito:wght@400;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #070b14; }
      button { cursor: pointer; font-family: 'Nunito', sans-serif; }
      input  { font-family: 'Nunito', sans-serif; }
      @keyframes pop {
        0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
        55%  { transform: translate(-50%,-50%) scale(1.4); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
      }
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-10px); }
        40%     { transform: translateX(10px); }
        60%     { transform: translateX(-5px); }
        80%     { transform: translateX(5px); }
      }
      @keyframes float0 { 0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(6deg)} }
      @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(-4deg)} }
      @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(3deg)} }
      @keyframes float3 { 0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(-6deg)} }
      @keyframes float4 { 0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-15px) rotate(5deg)} }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    `}</style>
  );
}

// ═══════════════════════════════════════════
// SHARED: PROGRESS HEADER
// ═══════════════════════════════════════════
function Header({ title, score, streak = 0, idx, total }) {
  return (
    <div style={{ width: "100%", maxWidth: "420px", marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: "14px" }}>{title}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {streak >= 2 && <span style={{ color: "#fb923c", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: "13px" }}>🔥{streak}x</span>}
          <span style={{ color: "#fbbf24", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: "14px" }}>⭐{score}</span>
        </div>
      </div>
      {total && (
        <>
          <div style={{ background: "#111827", borderRadius: 99, height: 5 }}>
            <div style={{ background: "linear-gradient(90deg,#22d3ee,#a78bfa)", height: 5, borderRadius: 99, width: `${(idx / total) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ color: "#1e293b", fontSize: 11, textAlign: "center", marginTop: 4 }}>{idx + 1} / {total}</div>
        </>
      )}
    </div>
  );
}

function QuitStrip({ onHome }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ marginTop: "auto", paddingTop: 16, width: "100%", maxWidth: 380 }}>
      <div style={{ borderTop: "1px solid #111827", paddingTop: 12 }}>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} style={{
            width: "100%", padding: 13, background: "none",
            border: "1px solid #1e293b", borderRadius: 14,
            color: "#475569", fontFamily: "'Exo 2'", fontWeight: 600, fontSize: 14,
            cursor: "pointer",
          }}>🏠  Quit to Menu</button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirming(false)} style={{
              flex: 1, padding: 13, background: "none",
              border: "1px solid #334155", borderRadius: 14,
              color: "#64748b", fontFamily: "'Exo 2'", fontWeight: 600, fontSize: 14,
              cursor: "pointer",
            }}>Cancel</button>
            <button onClick={onHome} style={{
              flex: 1, padding: 13, background: "#160a0a",
              border: "1px solid #ef4444", borderRadius: 14,
              color: "#ef4444", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14,
              cursor: "pointer",
            }}>Yes, Quit</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════
const BG_SYMBOLS = ["Au", "Ne", "Fe", "Hg", "Pb"];

function HomeScreen({ activePlayer, setActivePlayer, scores, difficulty, setDifficulty, onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#070b14", fontFamily: "'Nunito'", padding: "22px 18px", overflowY: "auto" }}>

      {/* Floating bg symbols */}
      {BG_SYMBOLS.map((s, i) => (
        <div key={i} style={{
          position: "fixed", pointerEvents: "none", zIndex: 0,
          left: `${8 + i * 19}%`, top: `${12 + (i % 3) * 22}%`,
          color: Object.values(GC)[i], fontSize: 22,
          fontFamily: "'Exo 2'", fontWeight: 900,
          opacity: 0.05, animation: `float${i} ${3.5 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}>{s}</div>
      ))}

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 26, position: "relative", zIndex: 1 }}>
        <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Exo 2'", marginBottom: 6 }}>
          Periodic Table Challenge
        </div>
        <div style={{ fontSize: 36, fontFamily: "'Exo 2'", fontWeight: 900,
          background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 55%, #f472b6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
          ⚗️ Element Quest
        </div>
      </div>

      {/* Player Select */}
      <Section label="Who's Playing?">
        <div style={{ display: "flex", gap: 12 }}>
          {[{ id: "kid", icon: "🧒", label: "Kid", color: "#4ade80" }, { id: "parent", icon: "🧑", label: "Parent", color: "#22d3ee" }].map(p => (
            <button key={p.id} onClick={() => setActivePlayer(p.id)} style={{
              flex: 1, padding: "16px 10px", textAlign: "center",
              background: activePlayer === p.id ? `${p.color}14` : "#0a0f1a",
              border: `2px solid ${activePlayer === p.id ? p.color : "#1e293b"}`,
              borderRadius: 18, transition: "all 0.2s",
              boxShadow: activePlayer === p.id ? `0 0 28px ${p.color}28` : "none",
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{p.icon}</div>
              <div style={{ color: activePlayer === p.id ? p.color : "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15 }}>{p.label}</div>
              <div style={{ color: activePlayer === p.id ? "#fbbf24" : "#1e293b", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 24, marginTop: 2 }}>
                {scores[p.id]}<span style={{ fontSize: 12, opacity: 0.6, marginLeft: 2 }}>pts</span>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Difficulty */}
      <Section label="Difficulty">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { id: "easy",   label: "⭐ Starter",  desc: "15 common elements" },
            { id: "medium", label: "⭐⭐ Explorer", desc: "31 elements" },
            { id: "hard",   label: "⭐⭐⭐ Expert", desc: "Trickiest ones" },
            { id: "all",    label: "🔥 Legend",    desc: "All 47 elements" },
          ].map(d => (
            <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
              padding: "12px 10px", textAlign: "left",
              background: difficulty === d.id ? "#1a2d4a" : "#0a0f1a",
              border: `2px solid ${difficulty === d.id ? "#22d3ee" : "#1e293b"}`,
              borderRadius: 14, transition: "all 0.2s",
              boxShadow: difficulty === d.id ? "0 0 16px rgba(34,211,238,0.15)" : "none",
            }}>
              <div style={{ color: difficulty === d.id ? "#22d3ee" : "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13 }}>{d.label}</div>
              <div style={{ color: "#1e293b", fontSize: 11, marginTop: 3 }}>{d.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Modes */}
      <Section label="Choose Your Mode">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { id: "flashcard", icon: "🃏", label: "Flash Cards",   desc: "Flip to learn symbols" },
            { id: "quiz",      icon: "⚡", label: "Symbol Quiz",   desc: "Pick the right symbol" },
            { id: "scramble",  icon: "🔤", label: "Name Scramble", desc: "Spell from the symbol" },
            { id: "speed",     icon: "🚀", label: "Speed Blast",   desc: "60-second frenzy!" },
          ].map(m => <ModeCard key={m.id} {...m} onClick={() => onStart(m.id)} />)}
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
      <div style={{ color: "#1e293b", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, textAlign: "center", marginBottom: 10, fontFamily: "'Exo 2'" }}>{label}</div>
      {children}
    </div>
  );
}

function ModeCard({ icon, label, desc, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      padding: "18px 12px", textAlign: "center",
      background: h ? "#111827" : "#0a0f1a",
      border: `2px solid ${h ? "#22d3ee" : "#1e293b"}`,
      borderRadius: 18, transition: "all 0.18s",
      boxShadow: h ? "0 0 22px rgba(34,211,238,0.14)" : "none",
    }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: h ? "#e2e8f0" : "#94a3b8", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14 }}>{label}</div>
      <div style={{ color: "#1e293b", fontSize: 11, marginTop: 4 }}>{desc}</div>
    </button>
  );
}

// ═══════════════════════════════════════════
// FLASH CARD MODE
// ═══════════════════════════════════════════
function FlashcardMode({ difficulty, onEnd, onHome, playSound }) {
  const [deck]    = useState(() => getDeck(difficulty));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const scoreRef  = useRef(0);
  const [score, setScore] = useState(0);

  if (idx >= deck.length) return null;
  const el    = deck[idx];
  const color = GC[el.group] || "#60a5fa";

  function next(gotIt) {
    if (gotIt) { scoreRef.current += 10; setScore(scoreRef.current); playSound("correct"); }
    else { playSound("wrong"); }
    if (idx + 1 >= deck.length) { onEnd(scoreRef.current); return; }
    setIdx(i => i + 1);
    setFlipped(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "'Nunito'" }}>
      <Header title="🃏 Flash Cards" score={score} idx={idx} total={deck.length} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 380 }}>
        {/* The Card */}
        <div onClick={() => { setFlipped(f => !f); playSound("flip"); }} style={{
          width: "100%", height: 270,
          background: "#0a0f1a",
          border: `3px solid ${color}`,
          boxShadow: `0 0 55px ${color}2a, inset 0 0 30px ${color}08`,
          borderRadius: 28,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", gap: 10, marginBottom: 28, userSelect: "none",
        }}>
          <div style={{ color, fontSize: 12, opacity: 0.45, fontFamily: "'Exo 2'", fontWeight: 600 }}>#{el.number}</div>
          {!flipped ? (
            <>
              <div style={{ color: "#e2e8f0", fontSize: 34, fontFamily: "'Exo 2'", fontWeight: 800, textAlign: "center", padding: "0 24px" }}>{el.name}</div>
              <div style={{ color: "#1e293b", fontSize: 13, marginTop: 18, fontStyle: "italic" }}>tap to reveal →</div>
            </>
          ) : (
            <>
              <div style={{ color, fontSize: 94, fontFamily: "'Exo 2'", fontWeight: 900, lineHeight: 1, textShadow: `0 0 40px ${color}` }}>{el.symbol}</div>
              <div style={{ color: "#334155", fontSize: 12, textTransform: "capitalize", letterSpacing: 1 }}>{el.group.replace(/-/g, " ")}</div>
            </>
          )}
        </div>

        {flipped ? (
          <div style={{ display: "flex", gap: 14, width: "100%" }}>
            <button onClick={() => next(false)} style={{ flex: 1, padding: 16, background: "#160a0a", border: "2px solid #ef4444", borderRadius: 18, color: "#ef4444", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14 }}>
              📚 Study More
            </button>
            <button onClick={() => next(true)} style={{ flex: 1, padding: 16, background: "#091508", border: "2px solid #4ade80", borderRadius: 18, color: "#4ade80", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14, boxShadow: "0 0 22px rgba(74,222,128,0.22)" }}>
              ✅ Got it! +10
            </button>
          </div>
        ) : (
          <div style={{ color: "#1e293b", fontSize: 14 }}>Tap the card to flip</div>
        )}
      </div>
      <QuitStrip onHome={onHome} />
    </div>
  );
}

// ═══════════════════════════════════════════
// QUIZ MODE
// ═══════════════════════════════════════════
function QuizMode({ difficulty, onEnd, onHome, playSound }) {
  const TOTAL = 10;
  const [deck]   = useState(() => getDeck(difficulty).slice(0, TOTAL));
  const [idx, setIdx]     = useState(0);
  const [choices, setChoices] = useState(() => getChoices(getDeck(difficulty)[0]));
  const [selected, setSelected] = useState(null);
  const [pop, setPop]     = useState(null);
  const scoreRef  = useRef(0);
  const streakRef = useRef(0);
  const wrongRef  = useRef(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  if (idx >= deck.length) return null;
  const el    = deck[idx];
  const color = GC[el.group] || "#60a5fa";

  // Keep choices fresh
  useEffect(() => {
    setChoices(getChoices(el));
  }, [idx]);

  function pick(c) {
    if (selected) return;
    setSelected(c);
    const correct = c.symbol === el.symbol;
    if (correct) {
      const earned = 10 + streakRef.current * 2;
      scoreRef.current += earned;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setPop("✅");
      if (streakRef.current >= 3) playSound("streak", streakRef.current);
      else playSound("correct");
    } else {
      streakRef.current = 0;
      wrongRef.current += 1;
      setStreak(0);
      setPop("❌");
      playSound("wrong");
    }
    setTimeout(() => {
      setPop(null);
      setSelected(null);
      if (idx + 1 >= TOTAL) { onEnd(scoreRef.current, wrongRef.current === 0); return; }
      setIdx(i => i + 1);
    }, 1100);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "'Nunito'" }}>
      <Header title="⚡ Symbol Quiz" score={score} streak={streak} idx={idx} total={TOTAL} />

      {pop && (
        <div style={{ position: "fixed", top: "42%", left: "50%", fontSize: 72, zIndex: 100, animation: "pop 0.85s ease forwards", pointerEvents: "none" }}>
          {pop}
        </div>
      )}

      {/* Question */}
      <div style={{ textAlign: "center", margin: "10px 0 28px" }}>
        <div style={{ color: "#1e293b", fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>What is the symbol for…</div>
        <div style={{ color: "#f1f5f9", fontSize: 40, fontFamily: "'Exo 2'", fontWeight: 900 }}>{el.name}</div>
        <div style={{ color, fontSize: 12, marginTop: 6, opacity: 0.6 }}>Element #{el.number}</div>
        {streak >= 2 && <div style={{ color: "#fb923c", fontSize: 13, marginTop: 8, fontWeight: 700 }}>🔥 {streak}x streak! +{streak * 2} bonus</div>}
      </div>

      {/* 2×2 Choices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 380 }}>
        {choices.map((c, i) => {
          const cc = GC[c.group] || "#60a5fa";
          const isRight  = c.symbol === el.symbol;
          const isPicked = selected?.symbol === c.symbol;
          let bg = "#0a0f1a", border = `${cc}55`, shadow = "none";
          if (selected) {
            if (isRight)       { bg = "#081a0a"; border = "#4ade80"; shadow = "0 0 22px rgba(74,222,128,0.28)"; }
            else if (isPicked) { bg = "#180707"; border = "#ef4444"; }
          }
          return (
            <button key={i} onClick={() => pick(c)} style={{
              padding: "22px 10px", background: bg,
              border: `2px solid ${border}`, borderRadius: 18,
              cursor: selected ? "default" : "pointer",
              boxShadow: shadow, transition: "all 0.22s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{ color: selected ? (isRight ? "#4ade80" : isPicked ? "#ef4444" : "#1e293b") : cc, fontSize: 46, fontFamily: "'Exo 2'", fontWeight: 900, lineHeight: 1, transition: "color 0.22s" }}>
                {c.symbol}
              </div>
              {selected && <div style={{ color: "#334155", fontSize: 11 }}>{c.name}</div>}
            </button>
          );
        })}
      </div>
      <QuitStrip onHome={onHome} />
    </div>
  );
}

// ═══════════════════════════════════════════
// SCRAMBLE MODE
// ═══════════════════════════════════════════
function ScrambleMode({ difficulty, onEnd, onHome, playSound }) {
  const TOTAL = 8;
  const [deck] = useState(() => getDeck(difficulty).filter(e => e.name.length >= 4).slice(0, TOTAL));
  const [idx, setIdx]   = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [typed, setTyped]   = useState("");
  const [hint, setHint]     = useState(false);
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);
  const wrongRef = useRef(0);
  const [score, setScore] = useState(0);
  const inputRef = useRef(null);

  if (idx >= deck.length) return null;
  const el    = deck[idx];
  const color = GC[el.group] || "#60a5fa";

  useEffect(() => {
    const letters = el.name.toUpperCase().split("");
    let s = el.name.toUpperCase();
    let tries = 0;
    while (s === el.name.toUpperCase() && tries < 40) { s = shuffle(letters).join(""); tries++; }
    setScrambled(s);
    setTyped("");
    setHint(false);
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [idx]);

  function submit() {
    if (typed.trim().toLowerCase() === el.name.toLowerCase()) {
      const earned = hint ? 5 : 10;
      scoreRef.current += earned;
      setScore(scoreRef.current);
      setFeedback("correct");
      playSound("correct");
      setTimeout(() => {
        if (idx + 1 >= TOTAL) { onEnd(scoreRef.current, wrongRef.current === 0); return; }
        setIdx(i => i + 1);
      }, 900);
    } else {
      setFeedback("wrong");
      wrongRef.current += 1;
      playSound("wrong");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "'Nunito'" }}>
      <Header title="🔤 Name Scramble" score={score} idx={idx} total={TOTAL} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 380, gap: 22 }}>

        {/* Symbol card */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: 3, marginBottom: 12, fontFamily: "'Exo 2'" }}>SYMBOL</div>
          <div style={{ display: "inline-block", padding: "18px 38px", background: "#0a0f1a", border: `3px solid ${color}`, boxShadow: `0 0 44px ${color}2a`, borderRadius: 20 }}>
            <div style={{ color, fontSize: 72, fontFamily: "'Exo 2'", fontWeight: 900, lineHeight: 1, textShadow: `0 0 30px ${color}` }}>{el.symbol}</div>
            <div style={{ color: "#1e293b", fontSize: 12, marginTop: 4 }}>#{el.number}</div>
          </div>
        </div>

        {/* Letter tiles */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: 3, marginBottom: 12, fontFamily: "'Exo 2'" }}>UNSCRAMBLE THE NAME</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {scrambled.split("").map((l, i) => (
              <div key={i} style={{ width: 34, height: 40, background: "#111827", border: "2px solid #1e293b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color, fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 16 }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ width: "100%" }}>
          <input
            ref={inputRef}
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Type element name…"
            style={{
              width: "100%", padding: "15px 16px",
              background: "#0a0f1a",
              border: `2px solid ${feedback === "correct" ? "#4ade80" : feedback === "wrong" ? "#ef4444" : "#1e293b"}`,
              borderRadius: 16, color: "#e2e8f0", fontSize: 18, fontWeight: 700,
              outline: "none", textAlign: "center", transition: "border-color 0.2s",
              animation: feedback === "wrong" ? "shake 0.4s ease" : "none",
            }}
          />
          {hint && <div style={{ color: "#fbbf24", fontSize: 13, textAlign: "center", marginTop: 8 }}>💡 Starts with "{el.name[0]}", {el.name.length} letters</div>}
          {feedback === "correct" && <div style={{ color: "#4ade80", fontSize: 16, textAlign: "center", marginTop: 8, fontWeight: 800 }}>✨ Correct! +{hint ? 5 : 10} pts</div>}
        </div>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          {!hint && (
            <button onClick={() => setHint(true)} style={{ flex: 1, padding: 14, background: "#111827", border: "2px solid #1e293b", borderRadius: 14, color: "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13 }}>
              💡 Hint (−5pts)
            </button>
          )}
          <button onClick={submit} style={{ flex: 2, padding: 14, background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 14, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15, boxShadow: "0 0 18px rgba(34,211,238,0.16)" }}>
            Submit ↵
          </button>
        </div>
      </div>
      <QuitStrip onHome={onHome} />
    </div>
  );
}

// ═══════════════════════════════════════════
// SPEED BLAST MODE
// ═══════════════════════════════════════════
function SpeedMode({ difficulty, onEnd, onHome, playSound }) {
  const pool     = getDeck(difficulty);
  const longPool = shuffle([...pool, ...pool, ...pool]);
  const [deck]   = useState(longPool);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [idx, setIdx]     = useState(0);
  const [choices, setChoices] = useState(() => getChoices(longPool[0]));
  const [flash, setFlash] = useState(null);
  const scoreRef   = useRef(0);
  const correctRef = useRef(0);
  const endedRef   = useRef(false);
  const [score, setScore]     = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started]);

  useEffect(() => {
    if (started && timeLeft === 0 && !endedRef.current) {
      endedRef.current = true;
      onEnd(scoreRef.current);
    }
  }, [timeLeft, started]);

  useEffect(() => {
    if (deck[idx]) setChoices(getChoices(deck[idx]));
  }, [idx]);

  function pick(c) {
    if (!started || timeLeft === 0) return;
    const el = deck[idx];
    if (c.symbol === el.symbol) {
      scoreRef.current += 10; correctRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      setFlash("correct");
      playSound("correct");
    } else {
      setFlash("wrong");
      playSound("wrong");
    }
    setTimeout(() => setFlash(null), 200);
    setIdx(i => i + 1);
  }

  const tc = timeLeft > 20 ? "#22d3ee" : timeLeft > 10 ? "#fbbf24" : "#ef4444";

  if (!started) {
    return (
      <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "'Nunito'" }}>
        <button onClick={onHome} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 72, marginBottom: 18 }}>🚀</div>
        <div style={{ color: "#f1f5f9", fontSize: 30, fontFamily: "'Exo 2'", fontWeight: 900, marginBottom: 8 }}>Speed Blast!</div>
        <div style={{ color: "#1e293b", fontSize: 14, marginBottom: 40 }}>60 seconds · No stopping · Max score wins!</div>
        <button onClick={() => setStarted(true)} style={{ padding: "20px 56px", background: "#0a1e33", border: "3px solid #22d3ee", borderRadius: 20, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 22, boxShadow: "0 0 50px rgba(34,211,238,0.28)", letterSpacing: 2 }}>
          GO! ⚡
        </button>
      </div>
    );
  }

  const el = deck[idx];

  return (
    <div style={{ minHeight: "100vh", background: flash === "correct" ? "#071808" : flash === "wrong" ? "#180707" : "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "'Nunito'", transition: "background 0.15s" }}>

      {/* Timer row */}
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#fbbf24", fontFamily: "'Exo 2'", fontWeight: 700 }}>⭐ {score}</span>
          <span style={{ color: tc, fontSize: 42, fontFamily: "'Exo 2'", fontWeight: 900, textShadow: `0 0 22px ${tc}`, transition: "color 0.5s" }}>{timeLeft}</span>
          <span style={{ color: "#4ade80", fontFamily: "'Exo 2'", fontWeight: 700 }}>✅ {correct}</span>
        </div>
        <div style={{ background: "#111827", borderRadius: 99, height: 6 }}>
          <div style={{ background: tc, height: 6, borderRadius: 99, width: `${(timeLeft / 60) * 100}%`, transition: "width 1s linear, background 0.5s", boxShadow: `0 0 8px ${tc}` }} />
        </div>
      </div>

      {/* Question */}
      {el && (
        <>
          <div style={{ textAlign: "center", margin: "14px 0 22px" }}>
            <div style={{ color: "#1e293b", fontSize: 12, marginBottom: 8 }}>SYMBOL FOR…</div>
            <div style={{ color: "#f1f5f9", fontSize: 44, fontFamily: "'Exo 2'", fontWeight: 900 }}>{el.name}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 380 }}>
            {choices.map((c, i) => {
              const cc = GC[c.group] || "#60a5fa";
              return (
                <button key={i} onClick={() => pick(c)} style={{ padding: "26px 10px", background: "#0a0f1a", border: `2px solid ${cc}40`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.08s" }}>
                  <div style={{ color: cc, fontSize: 48, fontFamily: "'Exo 2'", fontWeight: 900 }}>{c.symbol}</div>
                </button>
              );
            })}
          </div>
        </>
      )}
      <QuitStrip onHome={onHome} />
    </div>
  );
}

// ═══════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════
function ResultsScreen({ activePlayer, scores, lastRoundScore, onHome, onPlayAgain }) {
  const stars = lastRoundScore >= 70 ? 3 : lastRoundScore >= 30 ? 2 : 1;
  const msgs  = [
    ["Keep at it! 💪", "Practice makes perfect! 🔬", "Every scientist starts somewhere! 🧪"],
    ["Nice work! 👏", "Getting the hang of it! ⚗️", "Solid chemistry! 🧫"],
    ["Element Master! 🌟", "Periodic genius! 🏆", "Absolutely brilliant! ✨"],
  ];
  const msg    = msgs[stars - 1][Math.floor(Math.random() * 3)];
  const leader = scores.kid > scores.parent ? "kid" : scores.parent > scores.kid ? "parent" : null;

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Nunito'", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12, letterSpacing: 4 }}>
        {"⭐".repeat(stars)}{"⬛".repeat(3 - stars)}
      </div>
      <div style={{ color: "#f1f5f9", fontSize: 24, fontFamily: "'Exo 2'", fontWeight: 900, marginBottom: 6 }}>{msg}</div>
      <div style={{ color: "#fbbf24", fontSize: 42, fontFamily: "'Exo 2'", fontWeight: 900, marginBottom: 28 }}>
        +{lastRoundScore}<span style={{ fontSize: 18, opacity: 0.6, marginLeft: 4 }}>pts</span>
      </div>

      {/* Scoreboard */}
      <div style={{ background: "#0a0f1a", border: "2px solid #1e293b", borderRadius: 24, padding: "20px", width: "100%", maxWidth: 300, marginBottom: 24 }}>
        <div style={{ color: "#1e293b", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 14, fontFamily: "'Exo 2'" }}>Total Scores</div>
        {[{ id: "kid", icon: "🧒", label: "Kid", color: "#4ade80" }, { id: "parent", icon: "🧑", label: "Parent", color: "#22d3ee" }].map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #0d131f", background: p.id === activePlayer ? `${p.color}0a` : "transparent", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span style={{ color: p.id === activePlayer ? p.color : "#334155", fontFamily: "'Exo 2'", fontWeight: 700 }}>{p.label}</span>
              {leader === p.id && <span style={{ color: "#fbbf24", fontSize: 12 }}>👑</span>}
            </div>
            <div style={{ color: p.color, fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 26 }}>{scores[p.id]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 300 }}>
        <button onClick={onHome} style={{ flex: 1, padding: 16, background: "#111827", border: "2px solid #1e293b", borderRadius: 16, color: "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14 }}>
          🏠 Menu
        </button>
        <button onClick={onPlayAgain} style={{ flex: 2, padding: 16, background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 16, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15, boxShadow: "0 0 24px rgba(34,211,238,0.2)" }}>
          Play Again ⚡
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════
export default function ElementQuest() {
  const [screen, setScreen]   = useState("home");
  const [mode, setMode]       = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [activePlayer, setActivePlayer] = useState("kid");
  const [scores, setScores]   = useState({ parent: 0, kid: 0 });
  const [lastScore, setLastScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const { play, toggleMute, muted } = useSound();

  function startGame(m) { setMode(m); setGameKey(k => k + 1); setScreen("game"); }

  function endRound(earned, perfect = false) {
    setLastScore(earned);
    setScores(prev => ({ ...prev, [activePlayer]: prev[activePlayer] + earned }));
    play(perfect ? "perfect" : "roundEnd");
    setScreen("results");
  }

  const gp = { difficulty, onEnd: endRound, onHome: () => setScreen("home"), playSound: play };

  return (
    <>
      <GlobalStyles />
      {/* Mute toggle — fixed top-right, always visible */}
      <button onClick={toggleMute} style={{
        position: "fixed", top: 14, right: 14, zIndex: 200,
        background: "none", border: "none", fontSize: 20, cursor: "pointer",
        opacity: 0.5, transition: "opacity 0.2s",
      }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>
        {muted ? "🔇" : "🔊"}
      </button>
      {screen === "home" && (
        <HomeScreen activePlayer={activePlayer} setActivePlayer={setActivePlayer}
          scores={scores} difficulty={difficulty} setDifficulty={setDifficulty} onStart={startGame} />
      )}
      {screen === "game" && mode === "flashcard" && <FlashcardMode key={gameKey} {...gp} />}
      {screen === "game" && mode === "quiz"      && <QuizMode      key={gameKey} {...gp} />}
      {screen === "game" && mode === "scramble"  && <ScrambleMode  key={gameKey} {...gp} />}
      {screen === "game" && mode === "speed"     && <SpeedMode     key={gameKey} {...gp} />}
      {screen === "results" && (
        <ResultsScreen activePlayer={activePlayer} scores={scores} lastRoundScore={lastScore}
          onHome={() => setScreen("home")} onPlayAgain={() => { setGameKey(k => k + 1); setScreen("game"); }} />
      )}
    </>
  );
}
