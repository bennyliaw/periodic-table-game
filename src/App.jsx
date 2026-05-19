import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { useRegisterSW } from 'virtual:pwa-register/react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";

async function hashConstellation(indices) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(indices)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const DOTS = [
  { x: 18, y: 15 }, { x: 52, y:  8 }, { x: 80, y: 20 },
  { x: 12, y: 40 }, { x: 38, y: 35 }, { x: 68, y: 30 }, { x: 88, y: 45 },
  { x: 25, y: 62 }, { x: 55, y: 58 }, { x: 78, y: 68 },
  { x: 15, y: 82 }, { x: 48, y: 80 },
];

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
  { name: "Strontium",     symbol: "Sr", number: 38,  group: "alkaline-metal",  tier: 3 },
  { name: "Radium",        symbol: "Ra", number: 88,  group: "alkaline-metal",  tier: 3 },
  // tier 4 — "Known but uncommon"
  { name: "Selenium",      symbol: "Se", number: 34,  group: "nonmetal",        tier: 4 },
  { name: "Rubidium",      symbol: "Rb", number: 37,  group: "alkali-metal",    tier: 4 },
  { name: "Yttrium",       symbol: "Y",  number: 39,  group: "transition-metal",tier: 4 },
  { name: "Zirconium",     symbol: "Zr", number: 40,  group: "transition-metal",tier: 4 },
  { name: "Niobium",       symbol: "Nb", number: 41,  group: "transition-metal",tier: 4 },
  { name: "Molybdenum",    symbol: "Mo", number: 42,  group: "transition-metal",tier: 4 },
  { name: "Technetium",    symbol: "Tc", number: 43,  group: "transition-metal",tier: 4 },
  { name: "Ruthenium",     symbol: "Ru", number: 44,  group: "transition-metal",tier: 4 },
  { name: "Rhodium",       symbol: "Rh", number: 45,  group: "transition-metal",tier: 4 },
  { name: "Palladium",     symbol: "Pd", number: 46,  group: "transition-metal",tier: 4 },
  { name: "Cadmium",       symbol: "Cd", number: 48,  group: "transition-metal",tier: 4 },
  { name: "Indium",        symbol: "In", number: 49,  group: "metal",           tier: 4 },
  { name: "Antimony",      symbol: "Sb", number: 51,  group: "metalloid",       tier: 4 },
  { name: "Tellurium",     symbol: "Te", number: 52,  group: "metalloid",       tier: 4 },
  { name: "Cesium",        symbol: "Cs", number: 55,  group: "alkali-metal",    tier: 4 },
  { name: "Lanthanum",     symbol: "La", number: 57,  group: "lanthanide",      tier: 4 },
  { name: "Cerium",        symbol: "Ce", number: 58,  group: "lanthanide",      tier: 4 },
  { name: "Hafnium",       symbol: "Hf", number: 72,  group: "transition-metal",tier: 4 },
  { name: "Tantalum",      symbol: "Ta", number: 73,  group: "transition-metal",tier: 4 },
  { name: "Rhenium",       symbol: "Re", number: 75,  group: "transition-metal",tier: 4 },
  { name: "Osmium",        symbol: "Os", number: 76,  group: "transition-metal",tier: 4 },
  { name: "Iridium",       symbol: "Ir", number: 77,  group: "transition-metal",tier: 4 },
  { name: "Thallium",      symbol: "Tl", number: 81,  group: "metal",           tier: 4 },
  { name: "Bismuth",       symbol: "Bi", number: 83,  group: "metal",           tier: 4 },
  { name: "Polonium",      symbol: "Po", number: 84,  group: "metalloid",       tier: 4 },
  { name: "Astatine",      symbol: "At", number: 85,  group: "halogen",         tier: 4 },
  { name: "Radon",         symbol: "Rn", number: 86,  group: "noble-gas",       tier: 4 },
  { name: "Francium",      symbol: "Fr", number: 87,  group: "alkali-metal",    tier: 4 },
  { name: "Actinium",      symbol: "Ac", number: 89,  group: "actinide",        tier: 4 },
  { name: "Thorium",       symbol: "Th", number: 90,  group: "actinide",        tier: 4 },
  { name: "Protactinium",  symbol: "Pa", number: 91,  group: "actinide",        tier: 4 },
  { name: "Neptunium",     symbol: "Np", number: 93,  group: "actinide",        tier: 4 },
  { name: "Plutonium",     symbol: "Pu", number: 94,  group: "actinide",        tier: 4 },
  { name: "Americium",     symbol: "Am", number: 95,  group: "actinide",        tier: 4 },
  { name: "Curium",        symbol: "Cm", number: 96,  group: "actinide",        tier: 4 },
  // tier 5 — "Obscure / synthetic"
  { name: "Praseodymium",  symbol: "Pr", number: 59,  group: "lanthanide",      tier: 5 },
  { name: "Neodymium",     symbol: "Nd", number: 60,  group: "lanthanide",      tier: 5 },
  { name: "Promethium",    symbol: "Pm", number: 61,  group: "lanthanide",      tier: 5 },
  { name: "Samarium",      symbol: "Sm", number: 62,  group: "lanthanide",      tier: 5 },
  { name: "Europium",      symbol: "Eu", number: 63,  group: "lanthanide",      tier: 5 },
  { name: "Gadolinium",    symbol: "Gd", number: 64,  group: "lanthanide",      tier: 5 },
  { name: "Terbium",       symbol: "Tb", number: 65,  group: "lanthanide",      tier: 5 },
  { name: "Dysprosium",    symbol: "Dy", number: 66,  group: "lanthanide",      tier: 5 },
  { name: "Holmium",       symbol: "Ho", number: 67,  group: "lanthanide",      tier: 5 },
  { name: "Erbium",        symbol: "Er", number: 68,  group: "lanthanide",      tier: 5 },
  { name: "Thulium",       symbol: "Tm", number: 69,  group: "lanthanide",      tier: 5 },
  { name: "Ytterbium",     symbol: "Yb", number: 70,  group: "lanthanide",      tier: 5 },
  { name: "Lutetium",      symbol: "Lu", number: 71,  group: "lanthanide",      tier: 5 },
  { name: "Berkelium",     symbol: "Bk", number: 97,  group: "actinide",        tier: 5 },
  { name: "Californium",   symbol: "Cf", number: 98,  group: "actinide",        tier: 5 },
  { name: "Einsteinium",   symbol: "Es", number: 99,  group: "actinide",        tier: 5 },
  { name: "Fermium",       symbol: "Fm", number: 100, group: "actinide",        tier: 5 },
  { name: "Mendelevium",   symbol: "Md", number: 101, group: "actinide",        tier: 5 },
  { name: "Nobelium",      symbol: "No", number: 102, group: "actinide",        tier: 5 },
  { name: "Lawrencium",    symbol: "Lr", number: 103, group: "actinide",        tier: 5 },
  { name: "Rutherfordium", symbol: "Rf", number: 104, group: "transition-metal",tier: 5 },
  { name: "Dubnium",       symbol: "Db", number: 105, group: "transition-metal",tier: 5 },
  { name: "Seaborgium",    symbol: "Sg", number: 106, group: "transition-metal",tier: 5 },
  { name: "Bohrium",       symbol: "Bh", number: 107, group: "transition-metal",tier: 5 },
  { name: "Hassium",       symbol: "Hs", number: 108, group: "transition-metal",tier: 5 },
  { name: "Meitnerium",    symbol: "Mt", number: 109, group: "transition-metal",tier: 5 },
  { name: "Darmstadtium",  symbol: "Ds", number: 110, group: "transition-metal",tier: 5 },
  { name: "Roentgenium",   symbol: "Rg", number: 111, group: "transition-metal",tier: 5 },
  { name: "Copernicium",   symbol: "Cn", number: 112, group: "transition-metal",tier: 5 },
  { name: "Nihonium",      symbol: "Nh", number: 113, group: "metal",           tier: 5 },
  { name: "Flerovium",     symbol: "Fl", number: 114, group: "metal",           tier: 5 },
  { name: "Moscovium",     symbol: "Mc", number: 115, group: "metal",           tier: 5 },
  { name: "Livermorium",   symbol: "Lv", number: 116, group: "metal",           tier: 5 },
  { name: "Tennessine",    symbol: "Ts", number: 117, group: "halogen",         tier: 5 },
  { name: "Oganesson",     symbol: "Og", number: 118, group: "noble-gas",       tier: 5 },
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
  "lanthanide":       "#fb7185",
};

const PLAYER_ICONS  = [
  "🧒","🦸","🧙","🧝","🤖",
  "🦄","🐱","🐶","🦊","🐼",
  "🚀","🔬","🏆","🎮","🌟",
];
const PLAYER_COLORS = ["#4ade80","#22d3ee","#a78bfa","#fb923c","#f472b6",
                       "#fbbf24","#34d399","#60a5fa","#f87171","#e879f9"];

// ═══════════════════════════════════════════
// SOUND
// ═══════════════════════════════════════════
const PHRASES = {
  correct:  ["Great job!", "You got it!", "That's right!", "Spot on!", "Excellent work!", "Wonderful!", "You're a star!", "Nailed it!", "Brilliant thinking!", "Amazing!"],
  wrong:    ["Wrong!", "Oops!", "So close! Have another go!", "Not that, try again!", "Don't give up!", "Almost! Try again!", "Not quite, but keep going!"],
  streak3:  ["You're on a roll!", "Getting warm here!", "Keep it going!"],
  streak5:  ["You're on fire!", "Incredible! Keep it up!", "You cannot be stopped!"],
  streak7:  ["Unstoppable!", "Absolute genius!", "Legend status!", "Mind-blowing!", "Element master!", "Off the charts!", "Nobel Prize incoming!", "Flawless!", "Science royalty!", "Pure genius!", "You know everything!"],
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
// PLAYERS
// ═══════════════════════════════════════════
function genRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function usePlayers() {
  const [roomId, setRoomIdState] = useState(() => {
    let id = localStorage.getItem("eq_room_id");
    if (!id) { id = genRoomId(); localStorage.setItem("eq_room_id", id); }
    return id;
  });
  const [players, setPlayers] = useState([]);
  const [loaded, setLoaded]   = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    setPlayers([]);
    setLoaded(false);
    supabase
      .from("eq_players")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at")
      .then(({ data }) => { if (data) setPlayers(data); setLoaded(true); });

    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "eq_players", filter: `room_id=eq.${roomId}` },
        ({ eventType, new: next, old }) => {
          if (eventType === "INSERT")      setPlayers(prev => [...prev, next]);
          else if (eventType === "UPDATE") setPlayers(prev => prev.map(p => p.id === next.id ? next : p));
          else if (eventType === "DELETE") setPlayers(prev => prev.filter(p => p.id !== old.id));
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  function joinRoom(code) {
    const id = code.trim().toUpperCase().slice(0, 6);
    localStorage.setItem("eq_room_id", id);
    setRoomIdState(id);
    setActiveId(null);
  }

  async function addPlayer({ name, age, icon, color, constellationHash }, roomIdOverride) {
    const id         = Date.now().toString();
    const targetRoom = roomIdOverride || roomId;
    const isFirst    = players.filter(p => p.room_id === targetRoom).length === 0;
    setActiveId(id);
    await supabase.from("eq_players").insert({
      id, room_id: targetRoom, name, age: age || null, icon, color, score: 0,
      is_admin: isFirst,
      constellation_hash: constellationHash || null,
      auth_reset: !constellationHash,
    });
  }

  async function updateScore(id, earned, newHighestLevel) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const update = { score: player.score + earned, last_active: new Date().toISOString() };
    if (newHighestLevel) {
      const curr = LEVELS.findIndex(l => l.id === player.highest_level);
      const next = LEVELS.findIndex(l => l.id === newHighestLevel);
      if (next > curr) update.highest_level = newHighestLevel;
    }
    await supabase.from("eq_players").update(update).eq("id", id);
  }

  async function updateMastery(id, symbols) {
    await supabase.from("eq_players").update({ mastered_elements: symbols }).eq("id", id);
  }

  async function setAdminStatus(id, isAdmin) {
    await supabase.from("eq_players").update({ is_admin: isAdmin }).eq("id", id);
  }

  async function deletePlayer(id) {
    if (id === activeId) setActiveId(null);
    setPlayers(prev => prev.filter(p => p.id !== id));
    await supabase.from("eq_players").delete().eq("id", id);
  }

  async function resetPlayerAuth(id) {
    await supabase.from("eq_players").update({ constellation_hash: null, auth_reset: true }).eq("id", id);
  }

  async function saveConstellation(id, hash) {
    await supabase.from("eq_players").update({ constellation_hash: hash, auth_reset: false }).eq("id", id);
  }

  async function saveTrainingPass(id, levelId, mode, grade) {
    if (!grade) return;
    const player = players.find(p => p.id === id);
    if (!player) return;
    const current = player.training_passes ?? {};
    const existing = current[levelId]?.[mode];
    if (existing && GRADE_ORDER[existing] >= GRADE_ORDER[grade]) return;
    const updated = { ...current, [levelId]: { ...(current[levelId] ?? {}), [mode]: grade } };
    await supabase.from("eq_players").update({ training_passes: updated }).eq("id", id);
  }

  async function saveTrialGrade(id, levelId, grade) {
    if (!grade) return;
    const player = players.find(p => p.id === id);
    if (!player) return;
    const current = player.trial_grades ?? {};
    if (current[levelId] && GRADE_ORDER[current[levelId]] >= GRADE_ORDER[grade]) return;
    await supabase.from("eq_players").update({ trial_grades: { ...current, [levelId]: grade } }).eq("id", id);
  }

  async function unlockLevel(id, levelId) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const current = player.unlocked_levels ?? ["lv1", "lv2"];
    if (current.includes(levelId)) return;
    const bonus = UNLOCK_BONUS[levelId] ?? 0;
    await supabase.from("eq_players").update({
      unlocked_levels: [...current, levelId],
      score: (player.score ?? 0) + bonus,
      last_active: new Date().toISOString(),
    }).eq("id", id);
  }

  const scores = Object.fromEntries(players.map(p => [p.id, p.score]));
  const activePlayer = players.find(p => p.id === activeId) || null;
  return { players, scores, activePlayer, setActiveId, addPlayer, updateScore, updateMastery,
           setAdminStatus, deletePlayer, resetPlayerAuth, saveConstellation,
           saveTrainingPass, saveTrialGrade, unlockLevel,
           roomId, joinRoom, loaded };
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

const DIFF_MULT = { lv1: 0.2, lv2: 0.4, lv3: 0.6, lv4: 1.0, lv5: 1.3, lv6: 1.5 };

const LEVELS = [
  { id: "lv1", icon: "🥉", label: "🥉 Cadet",           line1: "Your first training onboard.",        line2: "Drill the 15 most common elements found in nature.",                              elements: 15,  basePts: 2,  rank: "Cadet" },
  { id: "lv2", icon: "🥈", label: "🥈 Petty Officer",   line1: "You've earned your first stripe.",    line2: "Expand to 31 elements — noble gases, halogens and everyday metals join the mix.", elements: 31,  basePts: 4,  rank: "Petty Officer" },
  { id: "lv3", icon: "🥇", label: "🥇 Warrant Officer", line1: "A new challenge entirely.",           line2: "Heavy metals and transitions — these 16 elements trip up even experienced sailors.", elements: 16, basePts: 6,  rank: "Warrant Officer" },
  { id: "lv4", icon: "🏆", label: "🏆 Lieutenant",      line1: "The combined challenge awaits.",      line2: "Prove mastery over all 47 elements learned in basic training.",                   elements: 47,  basePts: 10, rank: "Lieutenant" },
  { id: "lv5", icon: "👑", label: "👑 Captain",         line1: "Deep waters ahead.",                 line2: "82 elements — including the rare metals that power modern technology.",            elements: 82,  basePts: 15, rank: "Captain" },
  { id: "lv6", icon: "⚛️", label: "⚛️ Commodore",       line1: "Command of the full periodic table.", line2: "From Hydrogen to Oganesson — no element left behind.",                           elements: 118, basePts: 20, rank: "Commodore" },
];

function getLevelInfo(id) {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}

function getPool(difficulty) {
  return difficulty === "lv1" ? ELEMENTS.filter(e => e.tier === 1)
       : difficulty === "lv2" ? ELEMENTS.filter(e => e.tier <= 2)
       : difficulty === "lv3" ? ELEMENTS.filter(e => e.tier === 3)
       : difficulty === "lv4" ? ELEMENTS.filter(e => e.tier <= 3)
       : difficulty === "lv5" ? ELEMENTS.filter(e => e.tier <= 4)
       : difficulty === "lv6" ? ELEMENTS
       : ELEMENTS.filter(e => e.tier === 1);
}

function getDeck(difficulty) {
  return shuffle(getPool(difficulty));
}

const SESSION_SIZE = 15;

function getFlashDeck(difficulty, masteredSymbols) {
  const pool       = getDeck(difficulty);
  const unmastered = pool.filter(el => !masteredSymbols.includes(el.symbol));
  const mastered   = pool.filter(el =>  masteredSymbols.includes(el.symbol));
  return [...unmastered, ...mastered].slice(0, SESSION_SIZE);
}

function getChoices(correct) {
  const wrong = shuffle(ELEMENTS.filter(e => e.symbol !== correct.symbol)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// ═══════════════════════════════════════════
// LEVEL UNLOCK SYSTEM — CONSTANTS + HELPERS
// ═══════════════════════════════════════════
const UNLOCK_BONUS = { lv3: 10000, lv4: 25000, lv5: 50000, lv6: 100000 };
const GRADE_ORDER  = { pass: 1, merit: 2, distinction: 3 };
const GRADE_ICON   = { pass: "🔵", merit: "💜", distinction: "💫" };
const MODE_KEYS    = ["flashcard", "quiz", "scramble", "speed"];

function fmtBerry(n, prefix = true) {
  const num = n < 1000 ? String(n)
    : n < 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
    : Math.floor(n / 1000) + "k";
  return prefix ? "฿ " + num : num;
}

function isLevelUnlocked(player, levelId) {
  return (player?.unlocked_levels ?? ["lv1", "lv2"]).includes(levelId);
}

function trialPoolLevel(targetLevelId) {
  const i = LEVELS.findIndex(l => l.id === targetLevelId);
  return i > 0 ? LEVELS[i - 1].id : null;
}

function getTrainingGrade(player, levelId, mode) {
  return player?.training_passes?.[levelId]?.[mode] ?? null;
}

function getTrialGrade(player, levelId) {
  return player?.trial_grades?.[levelId] ?? null;
}

function trainingGradeFromAccuracy(correct, total) {
  const pct = correct / total;
  if (pct >= 0.9) return "distinction";
  if (pct >= 0.8) return "merit";
  if (pct >= 0.6) return "pass";
  return null;
}

function promotionPrereqsMet(player, targetLevelId) {
  if (!player) return false;
  const poolLvl = trialPoolLevel(targetLevelId);
  if (!poolLvl) return false;
  const pool = getPool(poolLvl);
  const mastered = player.mastered_elements ?? [];
  if (pool.filter(e => mastered.includes(e.symbol)).length / pool.length < 0.75) return false;
  const passes = player.training_passes?.[poolLvl] ?? {};
  return MODE_KEYS.every(m => passes[m] != null);
}

// ═══════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&family=Nunito:wght@400;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
      input, textarea { user-select: text; -webkit-user-select: text; }
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
      @keyframes wiggle {
        0%,100% { transform: rotate(-8deg) scale(1.15); }
        50%      { transform: rotate(8deg)  scale(1.15); }
      }
      @keyframes wild0 { 0%,100%{transform:rotate(0deg) scale(1)} 40%{transform:rotate(20deg) scale(1.12)} 70%{transform:rotate(-10deg) scale(0.9)} }
      @keyframes wild1 { 0%,100%{transform:rotate(0deg) scale(1)} 35%{transform:rotate(-22deg) scale(1.15)} 65%{transform:rotate(12deg) scale(0.88)} }
      @keyframes wild2 { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(28deg) scale(1.08)} 75%{transform:rotate(-8deg) scale(0.94)} }
      @keyframes wild3 { 0%,100%{transform:rotate(0deg) scale(1)} 45%{transform:rotate(-18deg) scale(1.12)} 80%{transform:rotate(15deg) scale(0.87)} }
      @keyframes wild4 { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(22deg) scale(1.06)} 55%{transform:rotate(-15deg) scale(0.92)} }
      @keyframes wild5 { 0%,100%{transform:rotate(0deg) scale(1)} 45%{transform:rotate(-25deg) scale(1.1)} 75%{transform:rotate(10deg) scale(0.95)} }
      @keyframes wild6 { 0%,100%{transform:rotate(0deg) scale(1)} 30%{transform:rotate(24deg) scale(1.14)} 60%{transform:rotate(-18deg) scale(0.89)} }
      @keyframes wild7 { 0%,100%{transform:rotate(0deg) scale(1)} 40%{transform:rotate(-20deg) scale(1.18)} 70%{transform:rotate(14deg) scale(0.84)} }
      @keyframes shake { 0%,100%{transform:translate(0,0) rotate(0deg)} 12%{transform:translate(-7px,3px) rotate(-11deg)} 25%{transform:translate(7px,-4px) rotate(11deg)} 37%{transform:translate(-6px,6px) rotate(-9deg)} 50%{transform:translate(6px,-5px) rotate(10deg)} 62%{transform:translate(-7px,2px) rotate(-11deg)} 75%{transform:translate(7px,-2px) rotate(11deg)} 87%{transform:translate(-3px,3px) rotate(-6deg)} }
      @keyframes floatIn { from{opacity:0;transform:scale(0.5) rotate(-15deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
      @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
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
          <div style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 4 }}>{idx + 1} / {total}</div>
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
// ADD PLAYER MODAL
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// CONSTELLATION AUTH
// ═══════════════════════════════════════════
function ConstellationPad({ mode, storedHash, color, onSuccess, onCancel }) {
  const [selected, setSelected]   = useState([]);
  const [error, setError]         = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [trailPos, setTrailPos]   = useState(null); // { x, y } in % units
  const svgRef                    = useRef(null);
  const selectedRef               = useRef([]);
  const hasDraggedRef             = useRef(false);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const MAX = 8, MIN = 3;

  function getDotAt(clientX, clientY) {
    const rect = svgRef.current.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width * 100;
    const py = (clientY - rect.top)  / rect.height * 100;
    return DOTS.findIndex(d => {
      const dx = (d.x - px) / 100 * rect.width;
      const dy = (d.y - py) / 100 * rect.height;
      return Math.sqrt(dx * dx + dy * dy) < 26;
    });
  }

  function getPointerPct(clientX, clientY) {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (clientY - rect.top)  / rect.height * 100)),
    };
  }

  function addDot(i) {
    if (selectedRef.current.includes(i) || selectedRef.current.length >= MAX) return;
    setSelected(prev => { const n = [...prev, i]; selectedRef.current = n; return n; });
    setError(false);
  }

  function handlePointerDown(e) {
    e.preventDefault();
    setIsDragging(true);
    setError(false);
    hasDraggedRef.current = false;
    const i = getDotAt(e.clientX, e.clientY);
    if (i >= 0) addDot(i);
    setTrailPos(getPointerPct(e.clientX, e.clientY));
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const i = getDotAt(e.clientX, e.clientY);
    if (i >= 0) { addDot(i); hasDraggedRef.current = true; }
    setTrailPos(getPointerPct(e.clientX, e.clientY));
  }

  async function submitDots(dots) {
    const hash = await hashConstellation(dots);
    if (mode === "setup") {
      onSuccess(hash);
    } else {
      if (hash === storedHash) { onSuccess(); }
      else { setError(true); setSelected([]); selectedRef.current = []; }
    }
  }

  function handlePointerUp() {
    setIsDragging(false);
    setTrailPos(null);
    if (hasDraggedRef.current && selectedRef.current.length >= MIN) {
      submitDots(selectedRef.current);
    }
  }

  async function confirm() {
    submitDots(selected);
  }

  const canConfirm = selected.length >= MIN;
  const lineColor  = error ? "#ef4444" : color;
  const lastDot    = selected.length > 0 ? DOTS[selected[selected.length - 1]] : null;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", paddingBottom: "75%",
                    border: `1px solid ${error ? "#ef4444" : "#1e293b"}`, borderRadius: 16,
                    marginBottom: 12, background: "#070b14", transition: "border-color 0.2s",
                    touchAction: "none", userSelect: "none" }}>
        <svg ref={svgRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: isDragging ? "crosshair" : "default" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}>

          {/* Confirmed lines */}
          {selected.slice(1).map((dotIdx, i) => {
            const a = DOTS[selected[i]], b = DOTS[dotIdx];
            return <line key={i} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
              stroke={lineColor} strokeWidth={2} opacity={0.8} />;
          })}

          {/* Trailing dashed line from last dot to finger */}
          {isDragging && lastDot && trailPos && (
            <line x1={`${lastDot.x}%`} y1={`${lastDot.y}%`}
              x2={`${trailPos.x}%`} y2={`${trailPos.y}%`}
              stroke={lineColor} strokeWidth={1.5} opacity={0.4}
              strokeDasharray="5,4" />
          )}

          {/* Dots */}
          {DOTS.map((d, i) => {
            const isSel = selected.includes(i);
            const order = selected.indexOf(i) + 1;
            return (
              <g key={i}>
                <circle cx={`${d.x}%`} cy={`${d.y}%`} r={isSel ? 11 : 7}
                  fill={isSel ? lineColor : "#1e293b"}
                  stroke={isSel ? lineColor : "#334155"} strokeWidth={2} />
                {isSel
                  ? <text x={`${d.x}%`} y={`${d.y}%`} textAnchor="middle"
                      dominantBaseline="central" fontSize={8} fill="#070b14" fontWeight="bold">{order}</text>
                  : <circle cx={`${d.x}%`} cy={`${d.y}%`} r={3} fill="#334155" />}
              </g>
            );
          })}
        </svg>
      </div>

      {error && <div style={{ color: "#ef4444", textAlign: "center", fontSize: 12, marginBottom: 8 }}>
        Pattern doesn't match — try again
      </div>}
      <div style={{ color: "#334155", fontSize: 11, textAlign: "center", marginBottom: 10 }}>
        {selected.length === 0
          ? "Press and drag across stars to draw your pattern"
          : selected.length < MIN
            ? `Keep going… (${selected.length}/${MAX})`
            : `${selected.length} stars connected`}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { setSelected([]); selectedRef.current = []; setError(false); }}
          style={{ flex: 1, padding: 11, background: "#111827", border: "2px solid #1e293b",
                   borderRadius: 12, color: "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Clear
        </button>
        <button onClick={confirm} disabled={!canConfirm}
          style={{ flex: 2, padding: 11, background: canConfirm ? `${color}18` : "#111827",
                   border: `2px solid ${canConfirm ? color : "#1e293b"}`, borderRadius: 12,
                   color: canConfirm ? color : "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14,
                   cursor: canConfirm ? "pointer" : "not-allowed" }}>
          {mode === "setup" ? "Set Pattern ✓" : "Confirm →"}
        </button>
      </div>
      {onCancel && <button onClick={onCancel}
        style={{ width: "100%", marginTop: 8, padding: 8, background: "none", border: "none",
                 color: "#334155", fontFamily: "'Exo 2'", fontSize: 12, cursor: "pointer" }}>
        Cancel
      </button>}
    </div>
  );
}

function ConstellationModal({ title, subtitle, mode, storedHash, color, onSuccess, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#070b14ee", zIndex: 400,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0a0f1a", border: `2px solid ${color}`, borderRadius: 28,
                    padding: "24px 20px", width: "100%", maxWidth: 340, fontFamily: "'Nunito'" }}>
        <div style={{ color: "#e2e8f0", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 18,
                      textAlign: "center", marginBottom: 4 }}>{title}</div>
        <div style={{ color: "#475569", fontSize: 12, textAlign: "center", marginBottom: 16 }}>{subtitle}</div>
        <ConstellationPad mode={mode} storedHash={storedHash} color={color}
          onSuccess={onSuccess} onCancel={onCancel} />
      </div>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return null;
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)  return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const d = Math.floor(secs / 86400);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

const RANK_BLURB = {
  null:  "Play your first round to earn a Marine rank!",
  lv1:   "You know the basics! Ready to try Petty Officer?",
  lv2:   "Solid foundation. Warrant Officer is calling.",
  lv3:   "Impressive! Can you handle Lieutenant difficulty?",
  lv4:   "You command the elements. Captain rank is within reach.",
  lv5:   "Elite. Only Commodore stands above you — all 118 elements.",
  lv6:   "You know all 118 elements. The Admirals await…",
};

function PlayerProfileCard({ p, score, isActive, onLogin, onSignOut, onClose }) {
  const level   = p.highest_level || null;
  const info    = level ? getLevelInfo(level) : null;
  const rankIcon = info ? info.icon : "🧹";
  const rankName = info ? info.rank : "Chore Boy";
  const blurb    = RANK_BLURB[level];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
         onClick={onClose}>
      {/* backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "#070b14bb" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", background: "#0d1424",
        border: `2px solid ${p.color}40`, borderRadius: "24px 24px 0 0",
        padding: "24px 20px 36px", fontFamily: "'Nunito'",
      }}>
        {/* drag handle */}
        <div style={{ width: 36, height: 4, background: "#1e293b", borderRadius: 2, margin: "0 auto 20px" }} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 42 }}>{p.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: p.color, fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 20 }}>{p.name}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {p.created_at && (
                <span style={{ color: "#64748b", fontSize: 12 }}>joined {timeAgo(p.created_at)}</span>
              )}
              {p.last_active && (
                <span style={{ color: "#64748b", fontSize: 12 }}>· active {timeAgo(p.last_active)}</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>{rankIcon}</div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 2, fontFamily: "'Exo 2'", fontWeight: 700 }}>{rankName}</div>
          </div>
        </div>

        {/* rank blurb */}
        <div style={{ background: "#0a0f1a", borderRadius: 14, padding: "12px 14px", marginBottom: 20,
                      border: `1px solid ${p.color}20` }}>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{blurb}</div>
        </div>

        {/* score */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ color: "#fbbf24", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 28 }}>
            ฿ {score.toLocaleString()}
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!isActive && (
            <button onClick={onLogin} style={{
              padding: "14px", background: `${p.color}18`, border: `2px solid ${p.color}`,
              borderRadius: 14, color: p.color, fontFamily: "'Exo 2'", fontWeight: 700,
              fontSize: 15, cursor: "pointer",
            }}>✅ Play as {p.name}</button>
          )}
          {isActive && (
            <button onClick={onSignOut} style={{
              padding: "14px", background: "#0a0f1a", border: "2px solid #334155",
              borderRadius: 14, color: "#64748b", fontFamily: "'Exo 2'", fontWeight: 700,
              fontSize: 15, cursor: "pointer",
            }}>Sign out</button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerChip({ p, isActive, score, rank, onTap, onLongPress }) {
  const pressTimer = useRef(null);
  const startPos   = useRef(null);
  const rankIcon = rank ? getLevelInfo(rank).icon : "🧹";

  function startPress() {
    pressTimer.current = setTimeout(() => { pressTimer.current = null; onLongPress(p); }, 600);
  }
  function endPress() {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; onTap(p); }
  }
  function cancelPress() { clearTimeout(pressTimer.current); pressTimer.current = null; }

  return (
    <button
      onTouchStart={e => {
        const t = e.touches[0];
        startPos.current = { x: t.clientX, y: t.clientY };
        startPress();
      }}
      onTouchMove={e => {
        if (!startPos.current) return;
        const t = e.touches[0];
        if (Math.abs(t.clientX - startPos.current.x) > 10 || Math.abs(t.clientY - startPos.current.y) > 10)
          cancelPress();
      }}
      onTouchEnd={e => { e.preventDefault(); endPress(); }}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: "relative",
        flex: "0 0 auto", minWidth: 88, padding: "14px 10px", textAlign: "center",
        background: isActive ? `${p.color}14` : "rgba(10,15,26,0.6)",
        border: `2px solid ${isActive ? p.color : "#1e293b"}`,
        borderRadius: 18, transition: "all 0.2s", cursor: "pointer",
        boxShadow: isActive ? `0 0 28px ${p.color}28` : "none",
      }}>
      {p.is_admin && (
        <span style={{ position: "absolute", top: 6, right: 6, fontSize: 12, lineHeight: 1, pointerEvents: "none" }}>👮</span>
      )}
      <span style={{ position: "absolute", top: 6, left: 7, fontSize: 13, lineHeight: 1, pointerEvents: "none" }}>{rankIcon}</span>
      <div style={{ fontSize: 26, marginBottom: 3 }}>{p.icon}</div>
      <div style={{ color: isActive ? p.color : "#94a3b8", fontFamily: "'Exo 2'", fontWeight: 700,
                    fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72 }}>
        {p.name}
      </div>
      <div style={{ color: isActive ? "#fbbf24" : "#64748b", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 20, marginTop: 2 }}>
        {fmtBerry(score)}
      </div>
    </button>
  );
}

function AddPlayerModal({ players, roomId, onAdd, onCancel }) {
  const [step, setStep]                   = useState(1);
  const [name, setName]                   = useState("");
  const [age, setAge]                     = useState("");
  const [iconIdx, setIconIdx]             = useState(0);
  const [isCustom, setIsCustom]           = useState(false);
  const [customIcon, setCustomIcon]       = useState("");
  const [constellationHash, setConstellationHash] = useState(null);
  const color        = PLAYER_COLORS[players.length % PLAYER_COLORS.length];
  const selectedIcon = isCustom ? customIcon : PLAYER_ICONS[iconIdx];
  const canStep1     = name.trim().length > 0 && selectedIcon.trim().length > 0;
  const canAdd       = canStep1 && constellationHash !== null;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ name: name.trim(), age: age ? parseInt(age) : null, icon: selectedIcon, color, constellationHash });
  }

  function handleCustomChange(e) {
    const segs = Intl.Segmenter
      ? [...new Intl.Segmenter().segment(e.target.value)].map(s => s.segment)
      : [...e.target.value];
    setCustomIcon(segs[0] || "");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#070b14ee", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <div style={{ background: "#0a0f1a", border: "2px solid #1e293b", borderRadius: 28, padding: "28px 24px", width: "100%", maxWidth: 360, fontFamily: "'Nunito'" }}>

        {step === 1 ? (<>
          <div style={{ color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 20, marginBottom: 22, textAlign: "center" }}>
            Create Account
          </div>

          {/* Icon picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 10, fontFamily: "'Exo 2'" }}>Choose Icon</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {PLAYER_ICONS.map((icon, i) => (
                <button key={i} onClick={() => { setIconIdx(i); setIsCustom(false); }} style={{
                  padding: 10, fontSize: 24, background: !isCustom && iconIdx === i ? `${color}20` : "#111827",
                  border: `2px solid ${!isCustom && iconIdx === i ? color : "#1e293b"}`,
                  borderRadius: 12, cursor: "pointer",
                }}>{icon}</button>
              ))}
            </div>
            <button onClick={() => { setIsCustom(true); setCustomIcon(""); }} style={{
              width: "100%", marginTop: 8, padding: "10px 16px",
              background: isCustom ? `${color}18` : "#111827",
              border: `2px solid ${isCustom ? color : "#1e293b"}`,
              borderRadius: 12, cursor: "pointer",
              color: isCustom ? color : "#475569",
              fontFamily: "'Exo 2'", fontWeight: 600, fontSize: 13,
            }}>✏️  Custom Icon</button>
            {isCustom && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <input value={customIcon} onChange={handleCustomChange} placeholder="Paste any emoji"
                  autoFocus
                  style={{ flex: 1, padding: "10px 14px", background: "#111827", border: `2px solid ${color}`, borderRadius: 12, color: "#e2e8f0", fontSize: 28, outline: "none", textAlign: "center" }} />
                {customIcon && <div style={{ fontSize: 40, lineHeight: 1 }}>{customIcon}</div>}
              </div>
            )}
          </div>

          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8, fontFamily: "'Exo 2'" }}>Name</div>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canStep1 && setStep(2)}
              placeholder="Enter name…" autoFocus={!isCustom}
              style={{ width: "100%", padding: "13px 16px", background: "#111827", border: `2px solid ${name.trim() ? color : "#1e293b"}`, borderRadius: 14, color: "#e2e8f0", fontSize: 16, outline: "none", transition: "border-color 0.2s" }} />
          </div>

          {/* Age — compact inline */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, fontFamily: "'Exo 2'", whiteSpace: "nowrap" }}>Age <span style={{ textTransform: "none", letterSpacing: 0, opacity: 0.6 }}>(opt)</span></div>
            <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="—"
              style={{ width: 64, padding: "10px 12px", background: "#111827", border: "2px solid #1e293b", borderRadius: 12, color: "#e2e8f0", fontSize: 15, outline: "none", textAlign: "center" }} />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {players.length > 0 && (
              <button onClick={onCancel} style={{ flex: 1, padding: 14, background: "none", border: "2px solid #1e293b", borderRadius: 14, color: "#475569", fontFamily: "'Exo 2'", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            )}
            <button onClick={() => setStep(2)} disabled={!canStep1}
              style={{ flex: 2, padding: 14, background: canStep1 ? `${color}18` : "#111827", border: `2px solid ${canStep1 ? color : "#1e293b"}`, borderRadius: 14, color: canStep1 ? color : "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15, cursor: canStep1 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              Next →
            </button>
          </div>
        </>) : (<>

          {/* Step 2 — Constellation */}
          <button onClick={() => setStep(1)}
            style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'Exo 2'", padding: 0, marginBottom: 16 }}>
            ← Back
          </button>

          {/* Player preview */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 6 }}>{selectedIcon}</div>
            <div style={{ color, fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 18 }}>{name}</div>
          </div>

          <div style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 4, fontFamily: "'Exo 2'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Secret Constellation</span>
            {constellationHash && <span style={{ color: "#4ade80", letterSpacing: 0, textTransform: "none", fontSize: 12 }}>✓ Set</span>}
          </div>
          <div style={{ color: "#1e293b", fontSize: 11, marginBottom: 12 }}>Connect at least 3 stars to set your pattern</div>

          {!constellationHash ? (
            <ConstellationPad mode="setup" color={color} onSuccess={hash => setConstellationHash(hash)} onCancel={null} />
          ) : (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ color: "#475569", fontSize: 12, marginBottom: 6 }}>Your constellation is set</div>
              <button onClick={() => setConstellationHash(null)}
                style={{ color: "#475569", fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito'", textDecoration: "underline" }}>
                ↺ Reset pattern
              </button>
            </div>
          )}

          <button onClick={handleAdd} disabled={!canAdd}
            style={{ width: "100%", marginTop: 8, padding: 14, background: canAdd ? `${color}18` : "#111827", border: `2px solid ${canAdd ? color : "#1e293b"}`, borderRadius: 14, color: canAdd ? color : "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15, cursor: canAdd ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {selectedIcon} Create Account ✓
          </button>
        </>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LANDING SCREEN
// ═══════════════════════════════════════════
function LandingScreen({ onJoinRoom, onStartFresh }) {
  const [view, setView]           = useState("main");
  const [roomInput, setRoomInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [checking, setChecking]   = useState(false);

  async function handleJoin() {
    const code = roomInput.trim().toUpperCase();
    if (code.length < 3) { setErrorMsg("Room code must be at least 3 characters"); setInputError(true); return; }
    setChecking(true);
    const { data } = await supabase.from("eq_players").select("id").eq("room_id", code).limit(1);
    setChecking(false);
    if (!data || data.length === 0) {
      setErrorMsg("Room not found — check the code and try again");
      setInputError(true);
      return;
    }
    onJoinRoom(code);
  }

  const FEATURES = [
    { icon: "🃏", label: "Flash Cards", desc: "flip to learn symbols" },
    { icon: "⚡", label: "Symbol Quiz", desc: "pick the right answer" },
    { icon: "🔤", label: "Name Scramble", desc: "spell from the symbol" },
    { icon: "🚀", label: "Speed Blast", desc: "30-second frenzy" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", fontFamily: "'Nunito'",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "32px 20px" }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeInUp 0.5s ease forwards" }}>
        <div style={{ fontSize: 52, fontFamily: "'Exo 2'", fontWeight: 900, lineHeight: 1.1,
                      background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 55%, #f472b6 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ⚗️ Element Quest
        </div>
        <div style={{ color: "#475569", fontSize: 14, marginTop: 8, fontFamily: "'Nunito'" }}>
          The periodic table game for curious minds
        </div>
      </div>

      {/* Feature card */}
      <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 20,
                    padding: "18px 20px", width: "100%", maxWidth: 340, marginBottom: 28 }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{f.icon}</span>
            <span style={{ color: "#334155", fontSize: 13, fontFamily: "'Exo 2'", fontWeight: 700 }}>{f.label}</span>
            <span style={{ color: "#1e293b", fontSize: 12 }}>— {f.desc}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ width: "100%", maxWidth: 340 }}>
        {view === "main" ? (<>
          <button onClick={() => { setView("joining"); setRoomInput(""); setInputError(false); }}
            style={{ width: "100%", padding: "15px 20px", marginBottom: 10,
                     background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 16,
                     color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Join a Room
          </button>
          <button onClick={onStartFresh}
            style={{ width: "100%", padding: "15px 20px",
                     background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                     border: "none", borderRadius: 16,
                     color: "#070b14", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 16, cursor: "pointer" }}>
            Start Fresh
          </button>
        </>) : (<>
          <div style={{ color: "#334155", fontSize: 11, textTransform: "uppercase", letterSpacing: 3,
                        marginBottom: 8, fontFamily: "'Exo 2'", textAlign: "center" }}>
            Enter Room Code
          </div>
          <input
            value={roomInput} autoFocus
            onChange={e => { setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); setInputError(false); }}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="e.g. ABC123"
            style={{ width: "100%", padding: "14px 16px", marginBottom: 10,
                     background: "#111827", border: `2px solid ${inputError ? "#ef4444" : roomInput.length >= 3 ? "#22d3ee" : "#1e293b"}`,
                     borderRadius: 14, color: "#22d3ee", fontSize: 22, fontFamily: "'Exo 2'",
                     fontWeight: 700, letterSpacing: 6, outline: "none", textAlign: "center",
                     transition: "border-color 0.2s", boxSizing: "border-box" }} />
          {inputError && <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 8 }}>
            {errorMsg}
          </div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setView("main"); setInputError(false); setErrorMsg(""); }}
              style={{ flex: 1, padding: 14, background: "none", border: "2px solid #1e293b",
                       borderRadius: 14, color: "#475569", fontFamily: "'Exo 2'", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleJoin} disabled={roomInput.length < 3 || checking}
              style={{ flex: 2, padding: 14,
                       background: roomInput.length >= 3 && !checking ? "#081a2a" : "#111827",
                       border: `2px solid ${roomInput.length >= 3 && !checking ? "#22d3ee" : "#1e293b"}`,
                       borderRadius: 14, color: roomInput.length >= 3 && !checking ? "#22d3ee" : "#334155",
                       fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15,
                       cursor: roomInput.length >= 3 && !checking ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              {checking ? "Checking…" : "Join →"}
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ROOM CODE BAR
// ═══════════════════════════════════════════
function RoomCodeBar({ roomId, onJoin }) {
  const [joining, setJoining]     = useState(false);
  const [input, setInput]         = useState("");
  const [copied, setCopied]       = useState(false);
  const [checking, setChecking]   = useState(false);
  const [inputError, setInputError] = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  function copy() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleJoin() {
    const code = input.trim().toUpperCase();
    if (code.length < 3) {
      setErrorMsg("At least 3 characters");
      setInputError(true);
      return;
    }
    setChecking(true);
    const { data } = await supabase.from("eq_players").select("id").eq("room_id", code).limit(1);
    setChecking(false);
    if (!data || data.length === 0) {
      setErrorMsg("Room not found");
      setInputError(true);
      return;
    }
    onJoin(code);
    setJoining(false);
    setInput("");
    setInputError(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#475569", fontSize: 11, fontFamily: "'Exo 2'", letterSpacing: 2 }}>ROOM</span>
        <span style={{ color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 15, letterSpacing: 4 }}>{roomId}</span>
        <button onClick={copy} title="Copy room code" style={{ background: "none", border: "none", color: copied ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>
          {copied ? "✓" : "⎘"}
        </button>
        <button onClick={() => { setJoining(j => !j); setInputError(false); setInput(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "'Exo 2'", padding: 0, textDecoration: "underline" }}>
          {joining ? "cancel" : "join room"}
        </button>
      </div>
      {joining && (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={e => { setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); setInputError(false); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              placeholder="XXXXXX" autoFocus
              style={{ width: 110, padding: "8px 12px", background: "#111827", border: `2px solid ${inputError ? "#ef4444" : input.length >= 3 ? "#22d3ee" : "#1e293b"}`, borderRadius: 10, color: "#22d3ee", fontSize: 15, fontFamily: "'Exo 2'", fontWeight: 700, outline: "none", letterSpacing: 4, textAlign: "center" }}
            />
            <button onClick={handleJoin} disabled={input.length < 3 || checking}
              style={{ padding: "8px 14px", background: "#081a2a", border: `2px solid ${input.length >= 3 && !checking ? "#22d3ee" : "#1e293b"}`, borderRadius: 10, color: input.length >= 3 && !checking ? "#22d3ee" : "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13, cursor: input.length >= 3 && !checking ? "pointer" : "not-allowed" }}>
              {checking ? "…" : "Join"}
            </button>
          </div>
          {inputError && <div style={{ color: "#ef4444", fontSize: 11, textAlign: "center" }}>{errorMsg}</div>}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════

function HomeScreen({ players, scores, activeId, setActiveId, onSetActiveId, onAddPlayer, roomId, joinRoom,
                      difficulty, setDifficulty, onStart, onStartTrial, activePlayer,
                      setAdminStatus, deletePlayer, resetPlayerAuth, saveConstellation }) {
  const [adminUnlocked, setAdminUnlocked]     = useState(false);
  const [adminUnlockTime, setAdminUnlockTime] = useState(0);
  const [constellationModal, setConstellationModal] = useState(null);
  const [actionTarget, setActionTarget]       = useState(null);
  const [profileTarget, setProfileTarget]     = useState(null);
  const rankScrollRef = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(false);

  function checkRankScroll() {
    const el = rankScrollRef.current;
    if (el) { setCanScrollL(el.scrollLeft > 0); setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 2); }
  }

  function scrollRank(dir) {
    rankScrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  }

  function handleRankWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const el = rankScrollRef.current;
    if (el) { e.preventDefault(); el.scrollBy({ left: e.deltaY, behavior: "auto" }); }
  }

  const [slots, setSlots] = useState(() => {
    const pool = getPool(difficulty);
    const els = [...pool].sort(() => Math.random() - 0.5).slice(0, 30);
    return els.map(el => ({
      el, phase: "in", cycleKey: 0,
      tx: (Math.random() - 0.5) * Math.min(window.innerWidth * 0.75, 760),
      ty: (Math.random() - 0.5) * Math.min(window.innerHeight * 0.75, 1040),
    }));
  });
  const slotsRef = useRef([]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  useEffect(() => {
    const timers = [];
    for (let i = 0; i < 30; i++) {
      const t = setTimeout(() => {
        setSlots(prev => prev.map((s, si) => si === i ? { ...s, phase: "idle" } : s));
      }, Math.floor(Math.random() * 400));
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const el = rankScrollRef.current;
    if (!el) return;
    checkRankScroll();
    const onScroll = () => checkRankScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => checkRankScroll());
    ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [slots]);
  const difficultyRef = useRef(difficulty);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const pool = getPool(difficulty);
    const timers = [];
    // shake each element individually with random spread (0–180ms)
    for (let i = 0; i < 30; i++) {
      const t = setTimeout(() => {
        setSlots(prev => prev.map((s, si) => si === i ? { ...s, phase: "wiggle" } : s));
      }, Math.floor(Math.random() * 180));
      timers.push(t);
    }
    // fade all out after shaking finishes (spread 180ms + shake 400ms + buffer)
    const tOut = setTimeout(() => {
      setSlots(prev => prev.map(s => ({ ...s, phase: "out" })));
    }, 650);
    timers.push(tOut);
    // stagger new elements in after fade completes
    const order = Array.from({ length: 30 }, (_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((slotIdx, step) => {
      const t1 = setTimeout(() => {
        const used = new Set(slotsRef.current.filter((_, i) => i !== slotIdx).map(s => s.el.symbol));
        const avail = pool.filter(e => !used.has(e.symbol));
        const src = avail.length ? avail : pool;
        const newEl = src[Math.floor(Math.random() * src.length)];
        setSlots(prev => prev.map((s, i) => i === slotIdx
          ? { el: newEl, phase: "in", cycleKey: s.cycleKey + 1 }
          : s));
        const t2 = setTimeout(() => {
          setSlots(prev => prev.map((s, i) => i === slotIdx ? { ...s, phase: "idle" } : s));
        }, 600);
        timers.push(t2);
      }, 1050 + step * 100);
      timers.push(t1);
    });
    return () => timers.forEach(clearTimeout);
  }, [difficulty]);

  useEffect(() => {
    if (!adminUnlocked) return;
    const t = setInterval(() => {
      if (Date.now() - adminUnlockTime > 5 * 60 * 1000) setAdminUnlocked(false);
    }, 10_000);
    return () => clearInterval(t);
  }, [adminUnlocked, adminUnlockTime]);

  useEffect(() => {
    const cycle = () => {
      const pool = getPool(difficultyRef.current);
      const cur = slotsRef.current;
      const idles = cur.reduce((acc, s, i) => s.phase === "idle" ? [...acc, i] : acc, []);
      if (!idles.length) return;
      const picks = [...idles].sort(() => Math.random() - 0.5).slice(0, Math.min(2, idles.length));
      picks.forEach(idx => {
        setSlots(prev => prev.map((s, i) => i === idx ? { ...s, phase: "out" } : s));
        setTimeout(() => {
          const used = new Set(slotsRef.current.map(s => s.el.symbol));
          const avail = pool.filter(e => !used.has(e.symbol));
          const src = avail.length ? avail : pool;
          const newEl = src[Math.floor(Math.random() * src.length)];
          setSlots(prev => prev.map((s, i) => i === idx
            ? { el: newEl, phase: "in", cycleKey: s.cycleKey + 1 }
            : s));
          setTimeout(() => {
            setSlots(prev => prev.map((s, i) => i === idx ? { ...s, phase: "idle" } : s));
          }, 600);
        }, 450);
      });
    };
    const t = setInterval(cycle, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const wander = () => {
      setSlots(prev => {
        const idles = prev.map((s, i) => s.phase === "idle" ? i : -1).filter(i => i >= 0);
        if (idles.length === 0) return prev;
        const picks = [...idles].sort(() => Math.random() - 0.5).slice(0, 6);
        return prev.map((s, i) => picks.includes(i) ? {
          ...s,
          tx: (Math.random() - 0.5) * Math.min(window.innerWidth * 0.75, 760),
          ty: (Math.random() - 0.5) * Math.min(window.innerHeight * 0.75, 1040),
        } : s);
      });
    };
    const t = setInterval(wander, 2500);
    return () => clearInterval(t);
  }, []);

  function handlePlayerTap(p) {
    setProfileTarget(p);
  }

  function handleProfileLogin(p) {
    setProfileTarget(null);
    if (!p.constellation_hash || p.auth_reset) {
      onSetActiveId(p.id);
      setConstellationModal({ mode: "setup", player: p, purpose: "login" });
    } else {
      setConstellationModal({ mode: "verify", player: p, purpose: "login" });
    }
  }

  function handleProfileSignOut() {
    setProfileTarget(null);
    setActiveId(null);
  }

  function handlePadlockClick() {
    if (adminUnlocked) { setAdminUnlocked(false); return; }
    setConstellationModal({ mode: "verify", player: activePlayer, purpose: "admin-unlock" });
  }

  const isAdminUnlocked = adminUnlocked && (Date.now() - adminUnlockTime < 5 * 60 * 1000);
  const adminCount = players.filter(p => p.is_admin).length;

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", fontFamily: "'Nunito'", padding: "2px 18px", overflowY: "auto" }}>

      {/* Floating bg symbols — 30 slots, elements cycle individually; wiggle+swap on level change */}
      {slots.map((slot, i) => {
        const left = (i * 37 + 3) % 92;
        const top  = (i * 23 + 8) % 85;
        const animIdx = i % 8;
        const dur = 10 + (i % 5) * 3;
        const dly = 0;
        const innerAnim = slot.phase === "in"
          ? `floatIn 0.5s ease-out both, wild${animIdx} ${dur}s ease-in-out 0.5s infinite`
          : slot.phase === "wiggle"
          ? `shake 0.2s ease-in-out 2`
          : `wild${animIdx} ${dur}s ease-in-out ${dly}s infinite`;
        const frozen = slot.phase === "wiggle" || slot.phase === "out";
        return (
          <div key={i} style={{
            position: "fixed", pointerEvents: "none", zIndex: 0,
            left: `${left}%`, top: `${top}%`,
            opacity: slot.phase === "out" ? 0 : 0.25,
            transition: slot.phase === "out" ? "opacity 0.35s ease-out" : "none",
          }}>
            <div style={{
              transform: `translate(${slot.tx}px, ${slot.ty}px)`,
              transition: frozen ? "none" : "transform 8s ease-in-out",
            }}>
              <div key={slot.cycleKey} style={{
                color: GC[slot.el.group] || "#22d3ee",
                fontSize: 32, fontFamily: "'Exo 2'", fontWeight: 900,
                animation: innerAnim,
              }}>{slot.el.symbol}</div>
            </div>
          </div>
        );
      })}

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 26, position: "relative", zIndex: 1 }}>
        {activePlayer?.is_admin && (
          <button onClick={handlePadlockClick} style={{
            position: "fixed", top: 46, right: 14, zIndex: 200,
            background: "none", border: "none", fontSize: 20, cursor: "pointer",
            opacity: isAdminUnlocked ? 0.9 : 0.5, transition: "opacity 0.2s",
          }} title={isAdminUnlocked ? "Admin unlocked — click to lock" : "Unlock admin"}>
            {isAdminUnlocked ? "🔓" : "🔒"}
          </button>
        )}
        <div style={{ color: "#475569", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Exo 2'", marginBottom: 6 }}>
          Periodic Table Challenge
          <span style={{ letterSpacing: 1, color: "#334155", marginLeft: 8 }}>· v{APP_VERSION}</span>
        </div>
        <div style={{ fontSize: 36, fontFamily: "'Exo 2'", fontWeight: 900,
          background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 55%, #f472b6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
          ⚗️ Element Quest
        </div>
        <div style={{ marginTop: 12 }}>
          <RoomCodeBar roomId={roomId} onJoin={joinRoom} />
        </div>
      </div>

      {/* Player Select */}
      <Section label="Who's Playing?">
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
          {players.map(p => (
            <PlayerChip key={p.id} p={p} isActive={activeId === p.id} score={scores[p.id] || 0}
              rank={p.highest_level || null}
              onTap={handlePlayerTap}
              onLongPress={p => {
                if (activePlayer?.is_admin) setActionTarget(p);
                else if (adminCount === 0 && p.id === activeId) setActionTarget(p);
              }} />
          ))}
          <button onClick={onAddPlayer} style={{
            flex: "0 0 auto", minWidth: 80, padding: "14px 10px", textAlign: "center",
            background: "rgba(10,15,26,0.6)", border: "2px dashed #1e293b",
            borderRadius: 18, cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 26, marginBottom: 3, color: "#334155" }}>＋</div>
            <div style={{ color: "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 12 }}>Add Player</div>
          </button>
        </div>
        {!activeId && players.length > 0 && (
          <div style={{ color: "#334155", fontSize: 12, textAlign: "center", marginTop: 8 }}>Select a player to start</div>
        )}
      </Section>

      {/* Difficulty */}
      <Section label="Select Your Rank">
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {canScrollL && (
            <button onClick={() => scrollRank(-1)}
              aria-label="Scroll ranks left"
              style={{ position: "absolute", left: -2, zIndex: 10, width: 26, height: 26, borderRadius: "50%",
                       background: "#0a0f1a", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 14,
                       display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                       boxShadow: "0 0 8px rgba(0,0,0,0.5)", padding: 0, lineHeight: 1 }}>
              ‹
            </button>
          )}
        <div ref={rankScrollRef} onWheel={handleRankWheel}
          style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", scrollBehavior: "smooth", width: "100%" }}>
          {LEVELS.map(d => {
            const active       = difficulty === d.id;
            const unlocked     = isLevelUnlocked(activePlayer, d.id);
            const hasTrialChip = d.id !== "lv1";
            const trialGrade   = hasTrialChip ? getTrialGrade(activePlayer, d.id) : null;
            const prereqsMet   = hasTrialChip && promotionPrereqsMet(activePlayer, d.id);
            const canAttempt   = !unlocked && prereqsMet && !!activePlayer;
            return (
              <button key={d.id}
                onClick={() => unlocked && setDifficulty(d.id)}
                style={{
                  flex: "0 0 calc((100% - 15px) / 2.5)", padding: "7px 8px", textAlign: "left",
                  position: "relative",
                  background: active && unlocked ? "rgba(26,45,74,0.65)" : "rgba(10,15,26,0.6)",
                  border: `2px solid ${active && unlocked ? "#22d3ee" : "#1e293b"}`,
                  borderRadius: 14, transition: "all 0.2s",
                  boxShadow: active && unlocked ? "0 0 16px rgba(34,211,238,0.15)" : "none",
                  cursor: unlocked ? "pointer" : "default",
                  opacity: unlocked ? 1 : 0.6,
                }}>
                {!unlocked && <span style={{ position: "absolute", top: 4, left: 5, fontSize: 9 }}>🔒</span>}
                <div style={{ fontSize: 15, marginBottom: 2, textAlign: "center" }}>{d.icon}</div>
                <div style={{ color: active && unlocked ? "#22d3ee" : "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 10, marginBottom: 3, textAlign: "center" }}>{d.label.replace(/^.{2}\s/, "")}</div>
                {unlocked ? (
                  <>
                    <div style={{ color: active ? "#94a3b8" : "#64748b", fontSize: 10, lineHeight: 1.3, fontWeight: 600 }}>{d.line1}</div>
                    <div style={{ color: active ? "#64748b" : "#475569", fontSize: 10, marginTop: 2, lineHeight: 1.3 }}>{d.line2}</div>
                  </>
                ) : (
                  <div style={{ color: "#334155", fontSize: 9, lineHeight: 1.3, marginBottom: 2 }}>Complete training to unlock</div>
                )}
                <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: "rgba(13,26,45,0.7)", border: "1px solid #1e293b", borderRadius: 5, padding: "1px 4px", fontSize: 8, color: "#64748b" }}>
                    {d.elements} elements
                  </span>
                  <span style={{ background: "rgba(13,26,45,0.7)", border: "1px solid #1e293b", borderRadius: 5, padding: "1px 4px", fontSize: 8, color: "#64748b" }}>
                    ฿ {d.basePts}/card
                  </span>
                  {hasTrialChip && activePlayer && (
                    <span
                      onClick={e => { e.stopPropagation(); if (unlocked || prereqsMet) onStartTrial(d.id); }}
                      style={{
                        opacity: (!unlocked && !prereqsMet) ? 0.35 : 1,
                        border: "1px solid #1e293b", borderRadius: 5, padding: "1px 4px",
                        fontSize: 8, background: "rgba(13,26,45,0.7)", color: "#64748b",
                        cursor: (!unlocked && !prereqsMet) ? "default" : "pointer",
                      }}>
                      ⚔️ {trialGrade ? GRADE_ICON[trialGrade] : "—"}
                    </span>
                  )}
                </div>
                {canAttempt && (
                  <div onClick={e => { e.stopPropagation(); onStartTrial(d.id); }}
                    style={{ marginTop: 5, width: "100%", padding: "3px 0",
                             border: "1px solid #fbbf24", borderRadius: 6, color: "#fbbf24",
                             background: "rgba(251,191,36,0.08)", fontSize: 8, fontWeight: 700,
                             textAlign: "center", cursor: "pointer" }}>
                    ⚔️ Attempt Promotion
                  </div>
                )}
              </button>
            );
          })}
        </div>
          {canScrollR && (
            <button onClick={() => scrollRank(1)}
              aria-label="Scroll ranks right"
              style={{ position: "absolute", right: -2, zIndex: 10, width: 26, height: 26, borderRadius: "50%",
                       background: "#0a0f1a", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 14,
                       display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                       boxShadow: "0 0 8px rgba(0,0,0,0.5)", padding: 0, lineHeight: 1 }}>
              ›
            </button>
          )}
        </div>
      </Section>

      {/* Modes */}
      <Section label="Choose Your Training Mode">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(() => {
            const pool           = getPool(difficulty);
            const mastered       = activePlayer ? (activePlayer.mastered_elements || []).filter(sym => pool.some(el => el.symbol === sym)) : [];
            const pct            = pool.length > 0 ? Math.min(100, Math.round((mastered.length / pool.length) * 100)) : 0;
            const flashcardExtra = activePlayer ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10, color: "#475569" }}>{mastered.length}/{pool.length} mastered</div>
                <div style={{ height: 3, background: "#1e293b", borderRadius: 2, marginTop: 3 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#4ade80", borderRadius: 2, transition: "width 0.4s" }} />
                </div>
              </div>
            ) : null;
            return [
              { id: "flashcard", icon: "🃏", label: "Flash Cards",   desc: "Flip to learn symbols", extra: flashcardExtra },
              { id: "quiz",      icon: "⚡", label: "Symbol Quiz",   desc: "Pick the right symbol" },
              { id: "scramble",  icon: "🔤", label: "Name Scramble", desc: "Spell from the symbol" },
              { id: "speed",     icon: "🚀", label: "Speed Blast",   desc: "30-second frenzy!" },
            ].map(m => {
              const modeGrade = activePlayer ? getTrainingGrade(activePlayer, difficulty, m.id) : undefined;
              const badge = activePlayer ? (modeGrade ? GRADE_ICON[modeGrade] : null) : undefined;
              return <ModeCard key={m.id} {...m} badge={badge} onClick={() => onStart(m.id)} />;
            });
          })()}
        </div>
      </Section>

      {/* Player profile card */}
      {profileTarget && (
        <PlayerProfileCard
          p={profileTarget}
          score={scores[profileTarget.id] || 0}
          isActive={profileTarget.id === activeId}
          onLogin={() => handleProfileLogin(profileTarget)}
          onSignOut={handleProfileSignOut}
          onClose={() => setProfileTarget(null)}
        />
      )}

      {/* Constellation auth modal */}
      {constellationModal && (
        <ConstellationModal
          title={constellationModal.mode === "setup" ? "Set your constellation" : constellationModal.player.name}
          subtitle={constellationModal.mode === "setup"
            ? "Connect at least 3 stars — this becomes your secret pattern"
            : "Draw your constellation to continue"}
          mode={constellationModal.mode}
          storedHash={constellationModal.player?.constellation_hash}
          color={constellationModal.player?.color || "#22d3ee"}
          onSuccess={hash => {
            if (constellationModal.purpose === "login") {
              if (constellationModal.mode === "setup") saveConstellation(constellationModal.player.id, hash);
              onSetActiveId(constellationModal.player.id);
            } else {
              setAdminUnlocked(true);
              setAdminUnlockTime(Date.now());
            }
            setConstellationModal(null);
          }}
          onCancel={() => setConstellationModal(null)}
        />
      )}

      {/* Admin action menu */}
      {actionTarget && (
        <div style={{ position: "fixed", inset: 0, background: "#070b14cc", zIndex: 400,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#0a0f1a", border: `2px solid ${actionTarget.color}`, borderRadius: 24,
                        padding: "24px 20px", width: "100%", maxWidth: 300, fontFamily: "'Nunito'" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 30 }}>{actionTarget.icon}</span>
              <div>
                <div style={{ color: "#e2e8f0", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 16 }}>{actionTarget.name}</div>
                {!isAdminUnlocked && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 2 }}>🔒 Unlock admin to manage</div>}
              </div>
            </div>
            {adminCount === 0 && actionTarget.id === activeId ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#475569", fontSize: 12, textAlign: "center", marginBottom: 4 }}>
                  No admin in this room — claim the role?
                </div>
                <button
                  onClick={() => { setAdminStatus(actionTarget.id, true); setActionTarget(null); }}
                  style={{ padding: 12, background: "#0a1a2e", border: "2px solid #22d3ee",
                           borderRadius: 12, color: "#22d3ee",
                           fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  ⭐ Claim admin
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  disabled={!isAdminUnlocked}
                  onClick={() => { resetPlayerAuth(actionTarget.id); setActionTarget(null); }}
                  style={{ padding: 12, background: isAdminUnlocked ? "#1a1a2e" : "#111827",
                           border: `2px solid ${isAdminUnlocked ? "#a78bfa" : "#1e293b"}`,
                           borderRadius: 12, color: isAdminUnlocked ? "#a78bfa" : "#334155",
                           fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13, cursor: isAdminUnlocked ? "pointer" : "not-allowed" }}>
                  ↺ Reset constellation
                </button>
                <button
                  disabled={!isAdminUnlocked || (actionTarget.is_admin && adminCount <= 1)}
                  onClick={() => { setAdminStatus(actionTarget.id, !actionTarget.is_admin); setActionTarget(null); }}
                  style={{ padding: 12, background: isAdminUnlocked && !(actionTarget.is_admin && adminCount <= 1) ? "#0a1a2e" : "#111827",
                           border: `2px solid ${isAdminUnlocked && !(actionTarget.is_admin && adminCount <= 1) ? "#22d3ee" : "#1e293b"}`,
                           borderRadius: 12, color: isAdminUnlocked && !(actionTarget.is_admin && adminCount <= 1) ? "#22d3ee" : "#334155",
                           fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13, cursor: isAdminUnlocked && !(actionTarget.is_admin && adminCount <= 1) ? "pointer" : "not-allowed" }}>
                  {actionTarget.is_admin ? "★ Remove admin" : "⭐ Make admin"}
                </button>
                <button
                  disabled={!isAdminUnlocked || actionTarget.id === activeId || (actionTarget.is_admin && adminCount <= 1)}
                  onClick={() => { deletePlayer(actionTarget.id); setActionTarget(null); }}
                  style={{ padding: 12, background: "#111827",
                           border: `2px solid ${isAdminUnlocked && actionTarget.id !== activeId && !(actionTarget.is_admin && adminCount <= 1) ? "#ef4444" : "#1e293b"}`,
                           borderRadius: 12,
                           color: isAdminUnlocked && actionTarget.id !== activeId && !(actionTarget.is_admin && adminCount <= 1) ? "#ef4444" : "#334155",
                           fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13,
                           cursor: isAdminUnlocked && actionTarget.id !== activeId && !(actionTarget.is_admin && adminCount <= 1) ? "pointer" : "not-allowed" }}>
                  🗑 Delete player
                </button>
              </div>
            )}
            <button onClick={() => setActionTarget(null)}
              style={{ width: "100%", marginTop: 12, padding: 10, background: "none", border: "none",
                       color: "#334155", fontFamily: "'Exo 2'", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, textAlign: "center", marginBottom: 10, fontFamily: "'Exo 2'" }}>{label}</div>
      {children}
    </div>
  );
}

function ModeCard({ icon, label, desc, onClick, extra, badge }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      padding: "18px 12px", textAlign: "center", position: "relative",
      background: h ? "rgba(17,24,39,0.7)" : "rgba(10,15,26,0.6)",
      border: `2px solid ${h ? "#22d3ee" : "#1e293b"}`,
      borderRadius: 18, transition: "all 0.18s",
      boxShadow: h ? "0 0 22px rgba(34,211,238,0.14)" : "none",
    }}>
      {badge !== undefined && (
        badge
          ? <span style={{ position: "absolute", top: 6, right: 7, fontSize: 12 }}>{badge}</span>
          : <span style={{ position: "absolute", top: 7, right: 8, fontSize: 9, color: "#334155" }}>—</span>
      )}
      <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: h ? "#e2e8f0" : "#94a3b8", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14 }}>{label}</div>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{desc}</div>
      {extra}
    </button>
  );
}

// ═══════════════════════════════════════════
// FLASH CARD MODE
// ═══════════════════════════════════════════
function FlashcardMode({ difficulty, masteredElements, onMastery, onEnd, onQuit, onHome, playSound }) {
  const masteredRef           = useRef([...masteredElements]);
  const sessionMasteredRef    = useRef(new Set());
  const [deck, setDeck]       = useState(() => getFlashDeck(difficulty, masteredElements));
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const scoreRef              = useRef(0);
  const [score, setScore]     = useState(0);

  const el    = deck[idx];
  const color = el ? (GC[el.group] || "#60a5fa") : "#22d3ee";

  function calcMasteryArgs() {
    const pool   = getPool(difficulty);
    const prior  = new Set(masteredElements);
    const totalMastered = pool.filter(e => prior.has(e.symbol) || sessionMasteredRef.current.has(e.symbol)).length;
    return [totalMastered, pool.length];
  }

  function next(action) {
    if (action === "done") {
      sessionMasteredRef.current.add(el.symbol);
      if (!masteredRef.current.includes(el.symbol)) {
        masteredRef.current = [...masteredRef.current, el.symbol];
        onMastery(masteredRef.current);
      }
      scoreRef.current += 5;
      setScore(scoreRef.current);
      playSound("correct");
      if (idx + 1 >= deck.length) { setSessionDone(true); return; }
    } else {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      playSound("flip");
      setDeck(prev => [...prev, el]);
    }
    setIdx(i => i + 1);
    setFlipped(false);
  }

  if (sessionDone) {
    const pool          = getPool(difficulty);
    const masteredInPool = masteredRef.current.filter(sym => pool.some(e => e.symbol === sym));
    const pct           = Math.min(100, Math.round((masteredInPool.length / pool.length) * 100));
    const allMastered   = masteredInPool.length >= pool.length;
    return (
      <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 24px", fontFamily: "'Nunito'" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ color: "#e2e8f0", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Session complete!</div>
        <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>{masteredInPool.length} / {pool.length} mastered ({pct}%)</div>
        <div style={{ height: 8, background: "#111827", borderRadius: 99, width: "100%", maxWidth: 300, marginBottom: 28 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#4ade80", borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        {allMastered && (
          <div style={{ color: "#4ade80", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14, marginBottom: 20 }}>🏆 All cards mastered!</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
          {!allMastered && (
            <button
              onClick={() => { setDeck(getFlashDeck(difficulty, masteredRef.current)); setIdx(0); setFlipped(false); setSessionDone(false); }}
              style={{ padding: 16, background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 18, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15 }}
            >Continue (next 15 cards)</button>
          )}
          <button
            onClick={() => onEnd(scoreRef.current, ...calcMasteryArgs())}
            style={{ padding: 16, background: "#111827", border: "2px solid #1e293b", borderRadius: 18, color: "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14 }}
          >🏠 Back to menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", fontFamily: "'Nunito'" }}>
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
            <button onClick={() => next("again")} style={{ flex: 1, padding: 16, background: "#160a0a", border: "2px solid #ef4444", borderRadius: 18, color: "#ef4444", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13 }}>
              📖 Show again later +฿1
            </button>
            <button onClick={() => next("done")} style={{ flex: 1, padding: 16, background: "#091508", border: "2px solid #4ade80", borderRadius: 18, color: "#4ade80", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13, boxShadow: "0 0 22px rgba(74,222,128,0.22)" }}>
              ✅ Mark done +฿5
            </button>
          </div>
        ) : (
          <div style={{ color: "#1e293b", fontSize: 14 }}>Tap the card to flip</div>
        )}
      </div>
      <QuitStrip onHome={() => onQuit(scoreRef.current, ...calcMasteryArgs())} />
    </div>
  );
}

// ═══════════════════════════════════════════
// QUIZ MODE
// ═══════════════════════════════════════════
function QuizMode({ difficulty, onEnd, onHome, onQuit, playSound }) {
  const TOTAL = 10;
  const [deck]   = useState(() => getDeck(difficulty).slice(0, TOTAL));
  const [idx, setIdx]     = useState(0);
  const [choices, setChoices] = useState(() => getChoices(getDeck(difficulty)[0]));
  const [selected, setSelected] = useState(null);
  const [pop, setPop]     = useState(null);
  const scoreRef  = useRef(0);
  const streakRef = useRef(0);
  const wrongRef  = useRef(0);
  const pendingRef = useRef(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => () => clearTimeout(pendingRef.current), []);

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
      const earned = Math.round((10 + streakRef.current * 2) * (DIFF_MULT[difficulty] ?? 1));
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
    pendingRef.current = setTimeout(() => {
      setPop(null);
      setSelected(null);
      if (idx + 1 >= TOTAL) { onEnd(scoreRef.current, TOTAL - wrongRef.current, TOTAL); return; }
      setIdx(i => i + 1);
    }, 1100);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", fontFamily: "'Nunito'" }}>
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
        {streak >= 2 && <div style={{ color: "#fb923c", fontSize: 13, marginTop: 8, fontWeight: 700 }}>🔥 {streak}x streak! +฿ {streak * 2} bonus</div>}
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
      <QuitStrip onHome={() => onQuit(scoreRef.current)} />
    </div>
  );
}

// ═══════════════════════════════════════════
// SCRAMBLE MODE
// ═══════════════════════════════════════════
function ScrambleMode({ difficulty, onEnd, onHome, onQuit, playSound }) {
  const TOTAL = 10;
  const [deck] = useState(() => getDeck(difficulty).filter(e => e.name.length >= 4).slice(0, TOTAL));
  const [idx, setIdx]       = useState(0);
  const [tiles, setTiles]   = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [typed, setTyped]   = useState("");
  const [hint, setHint]     = useState(false);
  const [feedback, setFeedback] = useState(null);
  const scoreRef     = useRef(0);
  const wrongRef     = useRef(0);
  const streakRef    = useRef(0);
  const tilesRef     = useRef([]);
  const dragIdxRef   = useRef(null);
  const pendingRef   = useRef(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const inputRef       = useRef(null);
  const lastModeRef    = useRef("drag"); // "drag" | "type" — tracks how user last interacted

  useEffect(() => { tilesRef.current = tiles; }, [tiles]);
  useEffect(() => () => clearTimeout(pendingRef.current), []);

  if (idx >= deck.length) return null;
  const el    = deck[idx];
  const color = GC[el.group] || "#60a5fa";

  useEffect(() => {
    const letters = el.name.toUpperCase().split("");
    let s = el.name.toUpperCase();
    let tries = 0;
    while (s === el.name.toUpperCase() && tries < 40) { s = shuffle(letters).join(""); tries++; }
    setTiles(s.split("").map((l, i) => ({ id: i, letter: l })));
    setDragIdx(null);
    setTyped("");
    setHint(false);
    setFeedback(null);
    // Only open keyboard if user was in type mode on the previous card
    if (lastModeRef.current === "type") setTimeout(() => inputRef.current?.focus(), 80);
  }, [idx]);

  function handlePointerDown(e, i) {
    e.preventDefault();
    lastModeRef.current = "drag";
    dragIdxRef.current = i;
    setDragIdx(i);
  }

  function handlePointerEnter(i) {
    const fromIdx = dragIdxRef.current;
    if (fromIdx === null || fromIdx === i) return;
    setTiles(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragIdxRef.current = i;
    setDragIdx(i);
  }

  function handlePointerMove(e) {
    if (dragIdxRef.current === null) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const idxStr = target?.dataset?.tileIdx;
    if (idxStr === undefined) return;
    handlePointerEnter(Number(idxStr));
  }

  function handlePointerUp() {
    if (dragIdxRef.current !== null) {
      setTyped(tilesRef.current.map(t => t.letter).join("").toLowerCase());
    }
    dragIdxRef.current = null;
    setDragIdx(null);
  }

  function submit() {
    if (typed.trim().toLowerCase() === el.name.toLowerCase()) {
      const earned = Math.round(((hint ? 5 : 10) + streakRef.current * 2) * (DIFF_MULT[difficulty] ?? 1));
      scoreRef.current += earned;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setFeedback("correct");
      playSound("correct");
      if (streakRef.current >= 3) playSound("streak", streakRef.current);
      pendingRef.current = setTimeout(() => {
        if (idx + 1 >= TOTAL) { onEnd(scoreRef.current, TOTAL - wrongRef.current, TOTAL); return; }
        setIdx(i => i + 1);
      }, 900);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setFeedback("wrong");
      wrongRef.current += 1;
      playSound("wrong");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", fontFamily: "'Nunito'" }}>
      <Header title="🔤 Name Scramble" score={score} streak={streak} idx={idx} total={TOTAL} />

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
          <div style={{ color: "#1e293b", fontSize: 11, letterSpacing: 3, marginBottom: 12, fontFamily: "'Exo 2'" }}>DRAG TO UNSCRAMBLE</div>
          <div
            style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center", touchAction: "none", userSelect: "none" }}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            {tiles.map((t, i) => (
              <div
                key={t.id}
                data-tile-idx={i}
                onPointerDown={e => handlePointerDown(e, i)}
                style={{
                  width: el.name.length > 9 ? 28 : 34, height: 40, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color, fontFamily: "'Exo 2'", fontWeight: 700, fontSize: el.name.length > 9 ? 13 : 16,
                  cursor: dragIdx === i ? "grabbing" : "grab",
                  background: dragIdx === i ? `${color}25` : "#111827",
                  border: `2px solid ${dragIdx === i ? color : "#1e293b"}`,
                  boxShadow: dragIdx === i ? `0 0 12px ${color}40` : "none",
                  animation: dragIdx === i ? "wiggle 0.25s ease-in-out infinite" : "none",
                  transition: dragIdx === i ? "none" : "background 0.12s, border-color 0.12s",
                }}
              >{t.letter}</div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ width: "100%" }}>
          <input
            ref={inputRef}
            value={typed}
            onChange={e => { lastModeRef.current = "type"; setTyped(e.target.value); }}
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
          {feedback === "correct" && <div style={{ color: "#4ade80", fontSize: 16, textAlign: "center", marginTop: 8, fontWeight: 800 }}>✨ Correct! +฿ {hint ? 5 : 10}</div>}
        </div>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          {!hint && (
            <button onClick={() => setHint(true)} style={{ flex: 1, padding: 14, background: "#111827", border: "2px solid #1e293b", borderRadius: 14, color: "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 13 }}>
              💡 Hint (−฿5)
            </button>
          )}
          <button onClick={submit} style={{ flex: 2, padding: 14, background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 14, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 15, boxShadow: "0 0 18px rgba(34,211,238,0.16)" }}>
            Submit ↵
          </button>
        </div>
      </div>
      <QuitStrip onHome={() => onQuit(scoreRef.current)} />
    </div>
  );
}

// ═══════════════════════════════════════════
// SPEED BLAST MODE
// ═══════════════════════════════════════════
function SpeedMode({ difficulty, onEnd, onHome, onQuit, playSound }) {
  const pool     = getDeck(difficulty);
  const longPool = shuffle([...pool, ...pool, ...pool]);
  const [deck]   = useState(longPool);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [idx, setIdx]     = useState(0);
  const [choices, setChoices] = useState(() => getChoices(longPool[0]));
  const [flash, setFlash] = useState(null);
  const scoreRef          = useRef(0);
  const correctRef        = useRef(0);
  const totalAnsweredRef  = useRef(0);
  const streakRef         = useRef(0);
  const endedRef   = useRef(false);
  const [score, setScore]     = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak]   = useState(0);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started]);

  useEffect(() => {
    if (started && timeLeft === 0 && !endedRef.current) {
      endedRef.current = true;
      onEnd(scoreRef.current, correctRef.current, totalAnsweredRef.current);
    }
  }, [timeLeft, started]);

  useEffect(() => {
    setChoices(getChoices(deck[idx % deck.length]));
  }, [idx]);

  function pick(c) {
    if (!started || timeLeft === 0) return;
    const el = deck[idx % deck.length];
    totalAnsweredRef.current += 1;
    if (c.symbol === el.symbol) {
      const earned = Math.round((10 + streakRef.current * 2) * (DIFF_MULT[difficulty] ?? 1));
      scoreRef.current += earned; correctRef.current += 1;
      streakRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current);
      setStreak(streakRef.current);
      setFlash("correct");
      playSound("correct");
      if (streakRef.current >= 3) playSound("streak", streakRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
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
        <div style={{ color: "#1e293b", fontSize: 14, marginBottom: 40 }}>30 seconds · No stopping · Max score wins!</div>
        <button onClick={() => setStarted(true)} style={{ padding: "20px 56px", background: "#0a1e33", border: "3px solid #22d3ee", borderRadius: 20, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 22, boxShadow: "0 0 50px rgba(34,211,238,0.28)", letterSpacing: 2 }}>
          GO! ⚡
        </button>
      </div>
    );
  }

  const el = deck[idx % deck.length];

  return (
    <div style={{ minHeight: "100vh", background: flash === "correct" ? "#071808" : flash === "wrong" ? "#180707" : "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", fontFamily: "'Nunito'", transition: "background 0.15s" }}>

      {/* Timer row */}
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#fbbf24", fontFamily: "'Exo 2'", fontWeight: 700 }}>⭐ {score}</span>
          <span style={{ color: tc, fontSize: 42, fontFamily: "'Exo 2'", fontWeight: 900, textShadow: `0 0 22px ${tc}`, transition: "color 0.5s" }}>{timeLeft}</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ color: "#4ade80", fontFamily: "'Exo 2'", fontWeight: 700 }}>✅ {correct}</span>
            {streak >= 2 && <span style={{ color: "#fb923c", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 12 }}>🔥{streak}x</span>}
          </span>
        </div>
        <div style={{ background: "#111827", borderRadius: 99, height: 6 }}>
          <div style={{ background: tc, height: 6, borderRadius: 99, width: `${(timeLeft / 30) * 100}%`, transition: "width 1s linear, background 0.5s", boxShadow: `0 0 8px ${tc}` }} />
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
      <QuitStrip onHome={() => onQuit(scoreRef.current)} />
    </div>
  );
}

// ═══════════════════════════════════════════
// PROMOTION TRIAL MODE
// ═══════════════════════════════════════════

function generateTrialQuestions(pool) {
  const cCount = 5 + Math.floor(Math.random() * 4); // 5–8 type-in
  const rem = 30 - cCount;
  const aExtra = Math.floor(Math.random() * (rem - 9)); // at least 5 for each of A and B
  const aCount = 5 + aExtra;
  const bCount = rem - aCount;
  const qs = [];
  for (let i = 0; i < aCount; i++) {
    const el = pool[Math.floor(Math.random() * pool.length)];
    const dist = shuffle(pool.filter(e => e.symbol !== el.symbol)).slice(0, 3);
    qs.push({ type: "A", el, choices: shuffle([...dist, el]) });
  }
  for (let i = 0; i < bCount; i++) {
    const el = pool[Math.floor(Math.random() * pool.length)];
    const dist = shuffle(pool.filter(e => e.symbol !== el.symbol)).slice(0, 3);
    qs.push({ type: "B", el, choices: shuffle([...dist, el]) });
  }
  for (let i = 0; i < cCount; i++) {
    const el = pool[Math.floor(Math.random() * pool.length)];
    qs.push({ type: "C", el });
  }
  return shuffle(qs);
}

function calcTrialGrade(correct, score, maxScore) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (correct >= 28 && pct >= 0.92) return "distinction";
  if (correct >= 24 && pct >= 0.80) return "merit";
  if (correct >= 20 && pct >= 0.60) return "pass";
  return null;
}

function TrialGame({ questions, targetLevel, wasUnlocked, onResult, onRetry, onHome }) {
  const TOTAL_TIME = 60;
  const maxScore = questions.reduce((s, q) => s + (q.type === "C" ? 15 : 5), 0);

  const [timeLeft, setTimeLeft]       = useState(TOTAL_TIME);
  const [qIdx, setQIdx]               = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore]             = useState(0);
  const [phase, setPhase]             = useState("playing"); // "playing" | "feedback" | "complete"
  const [feedback, setFeedback]       = useState(null);      // null | "correct" | "wrong"
  const [typedInput, setTypedInput]   = useState("");
  const [resultGrade, setResultGrade] = useState(null);

  const scoreRef     = useRef(0);
  const correctRef   = useRef(0);
  const phaseRef     = useRef("playing");
  const feedbackRef  = useRef(null);

  const targetLevelInfo = getLevelInfo(targetLevel);

  function finishTrial() {
    if (phaseRef.current === "complete") return;
    phaseRef.current = "complete";
    const grade = calcTrialGrade(correctRef.current, scoreRef.current, maxScore);
    setResultGrade(grade);
    setPhase("complete");
    onResult(grade);
  }

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) { finishTrial(); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  useEffect(() => {
    return () => { if (feedbackRef.current) clearTimeout(feedbackRef.current); };
  }, []);

  function advanceQ() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) {
      finishTrial();
    } else {
      setQIdx(nextIdx);
      setTypedInput("");
      setFeedback(null);
      setPhase("playing");
    }
  }

  function handleAnswer(isCorrect) {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "feedback";
    const q = questions[qIdx];
    const pts = isCorrect ? (q.type === "C" ? 15 : 5) : 0;
    if (isCorrect) {
      correctRef.current++;
      scoreRef.current += pts;
      setCorrectCount(c => c + 1);
      setScore(s => s + pts);
    }
    setFeedback(isCorrect ? "correct" : "wrong");
    setPhase("feedback");
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    feedbackRef.current = setTimeout(() => {
      phaseRef.current = "playing";
      advanceQ();
    }, 500);
  }

  useEffect(() => {
    if (phase !== "playing") return;
    const q = questions[qIdx];
    if (q?.type === "C" && typedInput.length > 0 && typedInput.length === q.el.symbol.length) {
      handleAnswer(typedInput.trim().toUpperCase() === q.el.symbol.toUpperCase());
    }
  }, [typedInput]);

  const q = questions[qIdx];
  const timePct = timeLeft / TOTAL_TIME;
  const fuseColor = timeLeft > 15 ? "#4ade80" : timeLeft > 5 ? "#fb923c" : "#ef4444";
  const unlockBonus = UNLOCK_BONUS[targetLevel] ?? 0;

  if (phase === "complete") {
    const grade = resultGrade;
    return (
      <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", fontFamily: "'Nunito'", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 8 }}>{grade ? GRADE_ICON[grade] : "💔"}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: grade ? "#f1f5f9" : "#94a3b8", fontFamily: "'Exo 2'", marginBottom: 6 }}>
          {grade === "distinction" ? "Distinction!" : grade === "merit" ? "Merit!" : grade === "pass" ? "Pass!" : "Not quite yet..."}
        </div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>
          {correctRef.current} / {questions.length} correct
        </div>
        <div style={{ color: "#475569", fontSize: 12, marginBottom: grade && !wasUnlocked && unlockBonus > 0 ? 12 : 24 }}>
          ฿ {scoreRef.current} of ฿ {maxScore} possible
        </div>
        {grade && !wasUnlocked && unlockBonus > 0 && (
          <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 10, padding: "8px 20px", color: "#fbbf24", fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            +฿ {unlockBonus.toLocaleString()} unlock reward!
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
          {grade && grade !== "distinction" && (
            <button onClick={onRetry} style={{ padding: "12px 0", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.5)", borderRadius: 12, color: "#a78bfa", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito'" }}>
              Try for 💫 Distinction
            </button>
          )}
          {!grade && (
            <button onClick={onRetry} style={{ padding: "12px 0", background: "rgba(30,41,59,0.8)", border: "1px solid #334155", borderRadius: 12, color: "#e2e8f0", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito'" }}>
              Try Again
            </button>
          )}
          <button onClick={onHome} style={{ padding: "12px 0", background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#94a3b8", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito'" }}>
            ← Back to Training
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 16px 24px", fontFamily: "'Nunito'" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ color: "#64748b", fontSize: 12 }}>⚔️ Promotion Trial → {targetLevelInfo.rank}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>{qIdx + 1} / {questions.length}</div>
      </div>

      {/* TNT fuse */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        <div style={{ flex: Math.max(0, 1 - timePct), minWidth: 0 }} />
        <span style={{ fontSize: 14, flexShrink: 0 }}>🔥</span>
        <div style={{ flex: timePct, height: 4, background: fuseColor, borderRadius: 2, transition: "flex 1s linear, background 0.3s" }} />
        <span style={{ fontSize: 20, flexShrink: 0, animation: timeLeft <= 5 ? "shake 0.15s infinite" : "none" }}>💣</span>
        <div style={{ color: timeLeft <= 5 ? "#ef4444" : "#94a3b8", fontSize: 13, fontWeight: 700, minWidth: 28, textAlign: "right" }}>{timeLeft}s</div>
      </div>

      <div style={{ color: "#475569", fontSize: 12, marginBottom: 14 }}>✓ {correctCount} correct · ฿ {score}</div>

      {/* Question card */}
      <div style={{ width: "100%", maxWidth: 480, background: "#0d1627", border: `2px solid ${feedback === "correct" ? "#4ade80" : feedback === "wrong" ? "#ef4444" : "#1e293b"}`, borderRadius: 18, padding: "20px 16px", marginBottom: 14, transition: "border-color 0.2s", textAlign: "center" }}>
        {q.type === "A" && (
          <>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 8 }}>Which element has this symbol?</div>
            <div style={{ color: "#e2e8f0", fontSize: 54, fontFamily: "'Exo 2'", fontWeight: 900, lineHeight: 1 }}>{q.el.symbol}</div>
            <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{q.el.number}</div>
          </>
        )}
        {q.type === "B" && (
          <>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 8 }}>What is the symbol for...</div>
            <div style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 700 }}>{q.el.name}</div>
          </>
        )}
        {q.type === "C" && (
          <>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 10 }}>Type the symbol for...</div>
            <div style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{q.el.name}</div>
            <input
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              disabled={phase !== "playing"}
              maxLength={q.el.symbol.length + 1}
              autoFocus
              style={{ width: 80, padding: "8px 0", textAlign: "center", fontSize: 24, fontFamily: "'Exo 2'", fontWeight: 700, background: "#0a0f1a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", outline: "none" }}
            />
          </>
        )}
      </div>

      {/* MC choices */}
      {(q.type === "A" || q.type === "B") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 480 }}>
          {q.choices.map((c, i) => {
            const isTarget = q.type === "A" ? c.name === q.el.name : c.symbol === q.el.symbol;
            const cc = GC[c.group] || "#64748b";
            const btnBg = feedback === "correct" && isTarget ? "rgba(74,222,128,0.15)"
                        : feedback === "wrong"   && isTarget ? "rgba(74,222,128,0.08)"
                        : "#0a0f1a";
            const btnBorder = feedback && isTarget ? "#4ade8080" : `${cc}40`;
            return (
              <button key={i} onClick={() => phase === "playing" && handleAnswer(isTarget)} style={{ padding: "14px 8px", background: btnBg, border: `2px solid ${btnBorder}`, borderRadius: 14, transition: "all 0.1s", cursor: phase === "playing" ? "pointer" : "default" }}>
                {q.type === "A"
                  ? <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                  : <div style={{ color: cc, fontSize: 30, fontFamily: "'Exo 2'", fontWeight: 900 }}>{c.symbol}</div>
                }
              </button>
            );
          })}
        </div>
      )}

      <button onClick={onHome} style={{ marginTop: "auto", paddingTop: 20, background: "none", border: "none", color: "#334155", fontSize: 12, cursor: "pointer" }}>
        ✕ quit trial
      </button>
    </div>
  );
}

function PromotionTrialMode({ targetLevel, wasUnlocked, onResult, onHome }) {
  const [attemptKey, setAttemptKey] = useState(0);
  const pool = useMemo(() => getPool(trialPoolLevel(targetLevel)), [targetLevel]);
  const questions = useMemo(() => generateTrialQuestions(pool), [pool, attemptKey]);

  return (
    <TrialGame
      key={attemptKey}
      questions={questions}
      targetLevel={targetLevel}
      wasUnlocked={wasUnlocked}
      onResult={onResult}
      onRetry={() => setAttemptKey(k => k + 1)}
      onHome={onHome}
    />
  );
}

// ═══════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════
function ResultsScreen({ activePlayer, players, scores, lastRoundScore, grade, onHome, onPlayAgain }) {
  const stars = lastRoundScore >= 70 ? 3 : lastRoundScore >= 30 ? 2 : 1;
  const msgs  = [
    ["Keep at it! 💪", "Practice makes perfect! 🔬", "Every scientist starts somewhere! 🧪"],
    ["Nice work! 👏", "Getting the hang of it! ⚗️", "Solid chemistry! 🧫"],
    ["Element Master! 🌟", "Periodic genius! 🏆", "Absolutely brilliant! ✨"],
  ];
  const msg     = msgs[stars - 1][Math.floor(Math.random() * 3)];
  const sorted  = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const topScore = scores[sorted[0]?.id] || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Nunito'", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12, letterSpacing: 4 }}>
        {"⭐".repeat(stars)}{"⬛".repeat(3 - stars)}
      </div>
      <div style={{ color: "#f1f5f9", fontSize: 24, fontFamily: "'Exo 2'", fontWeight: 900, marginBottom: 6 }}>{msg}</div>
      <div style={{ color: "#fbbf24", fontSize: 42, fontFamily: "'Exo 2'", fontWeight: 900, marginBottom: grade ? 10 : 28 }}>
        +{fmtBerry(lastRoundScore)}
      </div>
      {grade && (
        <div style={{ color: "#e2e8f0", fontSize: 15, fontFamily: "'Exo 2'", fontWeight: 700, marginBottom: 20 }}>
          {GRADE_ICON[grade]} {grade.charAt(0).toUpperCase() + grade.slice(1)}
        </div>
      )}

      {/* Scoreboard */}
      <div style={{ background: "#0a0f1a", border: "2px solid #1e293b", borderRadius: 24, padding: "20px", width: "100%", maxWidth: 300, marginBottom: 24 }}>
        <div style={{ color: "#1e293b", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 14, fontFamily: "'Exo 2'" }}>Total Scores</div>
        {sorted.map((p, i) => {
          const isLeader = i === 0 && topScore > 0;
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #0d131f", background: p.id === activePlayer?.id ? `${p.color}0a` : "transparent", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span style={{ color: p.id === activePlayer?.id ? p.color : "#334155", fontFamily: "'Exo 2'", fontWeight: 700 }}>{p.name}</span>
                {isLeader && <span style={{ color: "#fbbf24", fontSize: 12 }}>👑</span>}
              </div>
              <div style={{ color: p.color, fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 26 }}>{fmtBerry(scores[p.id] || 0)}</div>
            </div>
          );
        })}
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
function UpdateBanner({ sections, onUpdate, onDismiss }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(7,11,20,0.75)" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#0a0f1a", border: "2px solid #22d3ee", borderRadius: 20, padding: "24px 22px", fontFamily: "'Nunito'", boxShadow: "0 0 60px rgba(34,211,238,0.18)", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>⬆️</span>
          <span style={{ color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 900, fontSize: 16 }}>Update Ready</span>
          <span style={{ color: "#475569", fontSize: 12, marginLeft: 4 }}>running v{APP_VERSION}</span>
        </div>
        {sections?.map((s, idx) => s.notes?.length > 0 && (
          <div key={idx} style={{ marginBottom: idx < sections.length - 1 ? 14 : 20 }}>
            {s.heading && (
              <div style={{ color: idx === 0 ? "#64748b" : "#334155", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{s.heading}</div>
            )}
            <ul style={{ margin: 0, paddingLeft: 18, color: idx === 0 ? "#94a3b8" : "#475569", fontSize: idx === 0 ? 13 : 12, lineHeight: 1.8 }}>
              {s.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onUpdate} style={{ flex: 2, padding: "13px 0", background: "#081a2a", border: "2px solid #22d3ee", borderRadius: 12, color: "#22d3ee", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Update Now ↺
          </button>
          <button onClick={onDismiss} style={{ flex: 1, padding: "13px 0", background: "none", border: "2px solid #1e293b", borderRadius: 12, color: "#475569", fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ElementQuest() {
  const [screen, setScreen]   = useState("home");
  const [mode, setMode]       = useState(null);
  const [difficulty, setDifficulty] = useState("lv1");
  const [lastScore, setLastScore] = useState(0);
  const [lastRoundGrade, setLastRoundGrade] = useState(null);
  const [promotionTarget, setPromotionTarget] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showLanding, setShowLanding]     = useState(() => !localStorage.getItem("eq_visited"));
  const { play, toggleMute, muted } = useSound();
  const [updateSections, setUpdateSections] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(false);

  async function fetchNotesAndShowBanner() {
    try {
      const res = await fetch('/release-notes.json', { cache: 'no-store' });
      const data = await res.json();
      if (data.sections) {
        setUpdateSections(data.sections);
      } else {
        setUpdateSections([{ heading: data.heading ?? null, notes: data.notes ?? [] }]);
      }
    } catch {
      setUpdateSections([]);
    }
  }

  function handleUpdateDetected() {
    // Browser (non-installed) users: auto-apply update silently
    // PWA (standalone) users: show the banner so they can choose when to reload
    if (window.matchMedia('(display-mode: standalone)').matches) {
      fetchNotesAndShowBanner();
    } else {
      setPendingUpdate(true);
    }
  }

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh: handleUpdateDetected,
    onRegistered(r) {
      if (!r) return;
      setInterval(() => r.update(), 5 * 60 * 1000);
      if (r.waiting) handleUpdateDetected();
      // Check for updates when app is brought back to foreground (Android PWA resume)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update();
      });
    },
  });

  useEffect(() => {
    if (pendingUpdate) updateServiceWorker(true);
  }, [pendingUpdate]);
  const { players, scores, activePlayer, setActiveId, addPlayer, updateScore, updateMastery,
          setAdminStatus, deletePlayer, resetPlayerAuth, saveConstellation,
          saveTrainingPass, saveTrialGrade, unlockLevel,
          roomId, joinRoom, loaded } = usePlayers();

  function handleJoinRoom(code) {
    joinRoom(code);
    localStorage.setItem("eq_visited", "1");
    setShowLanding(false);
  }

  function handleStartFresh() {
    localStorage.setItem("eq_visited", "1");
    setShowLanding(false);
    setShowAddPlayer(true);
  }

  function startGame(m) {
    if (!activePlayer) return;
    setMode(m); setGameKey(k => k + 1); setScreen("game");
  }

  function makeEndRound(modeKey) {
    return (earned, correct = 0, total = 0) => {
      const grade = total > 0 ? trainingGradeFromAccuracy(correct, total) : null;
      if (grade && activePlayer) saveTrainingPass(activePlayer.id, difficulty, modeKey, grade);
      if (activePlayer) updateScore(activePlayer.id, earned, difficulty);
      setLastScore(earned);
      setLastRoundGrade(grade);
      play(grade === "distinction" ? "perfect" : "roundEnd");
      setScreen("results");
    };
  }

  function flashcardQuit(earned, correct = 0, total = 0) {
    if (total > 0 && activePlayer) {
      const grade = trainingGradeFromAccuracy(correct, total);
      if (grade) saveTrainingPass(activePlayer.id, difficulty, "flashcard", grade);
    }
    if (activePlayer && earned > 0) updateScore(activePlayer.id, earned, difficulty);
    setScreen("home");
  }

  function quitRound(earned) {
    if (activePlayer && earned > 0) updateScore(activePlayer.id, earned, difficulty);
    setScreen("home");
  }

  function startTrial(targetLevelId) {
    setPromotionTarget(targetLevelId);
    setScreen("promotion");
  }

  const gp = { difficulty, onEnd: makeEndRound("quiz"), onHome: () => setScreen("home"), onQuit: quitRound, playSound: play };

  return (
    <>
      {updateSections !== null && (
        <UpdateBanner
          sections={updateSections}
          onUpdate={() => updateServiceWorker(true)}
          onDismiss={() => setUpdateSections(null)}
        />
      )}
      <GlobalStyles />
      {showLanding && (
        <LandingScreen onJoinRoom={handleJoinRoom} onStartFresh={handleStartFresh} />
      )}
      {!showLanding && showAddPlayer && (
        <AddPlayerModal
          players={players}
          roomId={roomId}
          onAdd={async ({ constellationHash, ...playerData }) => {
            await addPlayer({ ...playerData, constellationHash });
            setShowAddPlayer(false);
          }}
          onCancel={() => setShowAddPlayer(false)}
        />
      )}
      {/* Mute toggle — fixed top-right, always visible */}
      <button onClick={toggleMute} style={{
        position: "fixed", top: 14, right: 14, zIndex: 200,
        background: "none", border: "none", fontSize: 20, cursor: "pointer",
        opacity: 0.5, transition: "opacity 0.2s",
      }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>
        {muted ? "🔇" : "🔊"}
      </button>
      {screen === "home" && (
        <HomeScreen
          players={players} scores={scores}
          activeId={activePlayer?.id} setActiveId={setActiveId} onSetActiveId={setActiveId}
          activePlayer={activePlayer}
          onAddPlayer={() => setShowAddPlayer(true)}
          roomId={roomId} joinRoom={joinRoom}
          difficulty={difficulty} setDifficulty={setDifficulty}
          onStart={startGame} onStartTrial={startTrial}
          setAdminStatus={setAdminStatus}
          deletePlayer={deletePlayer}
          resetPlayerAuth={resetPlayerAuth}
          saveConstellation={saveConstellation}
        />
      )}
      {screen === "game" && mode === "flashcard" && (
        <FlashcardMode
          key={gameKey} {...gp}
          onEnd={makeEndRound("flashcard")} onQuit={flashcardQuit}
          masteredElements={activePlayer?.mastered_elements || []}
          onMastery={symbols => updateMastery(activePlayer.id, symbols)}
        />
      )}
      {screen === "game" && mode === "quiz"      && <QuizMode      key={gameKey} {...gp} onEnd={makeEndRound("quiz")} />}
      {screen === "game" && mode === "scramble"  && <ScrambleMode  key={gameKey} {...gp} onEnd={makeEndRound("scramble")} />}
      {screen === "game" && mode === "speed"     && <SpeedMode     key={gameKey} {...gp} onEnd={makeEndRound("speed")} />}
      {screen === "results" && (
        <ResultsScreen
          activePlayer={activePlayer} players={players} scores={scores}
          lastRoundScore={lastScore} grade={lastRoundGrade}
          onHome={() => setScreen("home")}
          onPlayAgain={() => { setGameKey(k => k + 1); setScreen("game"); }}
        />
      )}
      {screen === "promotion" && promotionTarget && (
        <PromotionTrialMode
          key={promotionTarget}
          targetLevel={promotionTarget}
          wasUnlocked={isLevelUnlocked(activePlayer, promotionTarget)}
          onResult={async (grade) => {
            if (!activePlayer) return;
            await saveTrialGrade(activePlayer.id, promotionTarget, grade);
            if (grade && !isLevelUnlocked(activePlayer, promotionTarget)) {
              await unlockLevel(activePlayer.id, promotionTarget);
            }
          }}
          onHome={() => { setPromotionTarget(null); setScreen("home"); }}
        />
      )}
    </>
  );
}
