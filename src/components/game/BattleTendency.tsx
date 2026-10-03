import { useCallback, useEffect, useRef, useState } from "react";

/* ============ PARTE 2: BATTLE TENDENCY ============ */
const W = 176;
const H = 272;

type Stage = "prologue" | "pillar" | "esidisi" | "wamuu" | "kars" | "volcano" | "cinema" | "ending" | "done";
type Card = { title: string; sub: string; btn: string; retry?: boolean } | null;

const PROLOGUE =
  "Nova York e Itália, 1938. Para deter a ameaça milenar dos Homens do Pilar, o jovem Joseph Joestar precisa dominar a técnica do Hamon e superar testes mortais de pura inteligência.";

const CARDS: Record<string, Card> = {
  pillar: {
    title: "O PILAR DE ÓLEO",
    sub: "Ilha de Lisa Lisa. Suba os 24 metros do pilar coberto de óleo. Toque em RITMO DO HAMON quando o marcador estiver na faixa dourada e SEGURE para aderir. Desvie dos jatos de óleo!",
    btn: "INICIAR TREINAMENTO",
  },
  esidisi: {
    title: "ETAPA ESIDISI",
    sub: "Roma, arena subterrânea. Sangue Fervente! Corra para os quadrados VERDES que piscam antes que o sangue jorre. Proteja o cachecol!",
    btn: "ENFRENTAR ESIDISI",
  },
  wamuu: {
    title: "ETAPA WHAMUU",
    sub: "Tempestade de Areia Psíquica! Atirar direto não adianta. Use ESFERAS DE AÇO sob um gancho do teto: a esfera ricocheteia como espelho. Acerte as costas de Whamuu 3 vezes.",
    btn: "ENFRENTAR WHAMUU",
  },
  kars: {
    title: "ETAPA KARS",
    sub: "Lâminas de Luz! Desvie dos cortes e use BLEFAR para prever a próxima fala de Kars. Acertando, ele hesita por 3 segundos: pegue a Pedra de Aja no centro e fuja pela saída no topo!",
    btn: "ENFRENTAR KARS",
  },
  volcano: {
    title: "A BATALHA NO VULCÃO",
    sub: "Kars tornou-se o SER SUPREMO. Sobreviva às zonas vermelhas, piranhas e tentáculos de luz. Quando um Nó Vulcânico brilhar, vá até ele e use INTERAGIR com a Pedra de Aja. Ative os 3!",
    btn: "SOBREVIVER",
  },
};

const BLUFFS = [
  {
    kars: "Hmph... Você é rápido para um humano, JoJo. Mas...",
    options: [
      "\"...isso não vai durar para sempre!\"",
      "\"...a Pedra de Aja será minha!\"",
      "\"...eu poderia ser seu amigo.\"",
    ],
    correct: 1,
  },
  {
    kars: "Eu vivo há mais de dez mil anos. E sabe o que aprendi?",
    options: [
      "\"Que os humanos são vermes insignificantes!\"",
      "\"Que o sol é belo.\"",
      "\"Que devo pedir desculpas.\"",
    ],
    correct: 0,
  },
  {
    kars: "Ora, ora... Seus truques baratos não funcionam comigo!",
    options: [
      "\"Vou contar até três!\"",
      "\"Eu me rendo, JoJo.\"",
      "\"Minhas Lâminas de Luz vão te fatiar!\"",
    ],
    correct: 2,
  },
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ---------- sprites procedurais ---------- */
function px(c: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawJoseph(c: CanvasRenderingContext2D, x: number, y: number, t: number, climbing = false, hurt = false) {
  if (hurt && Math.floor(t * 20) % 2) return;
  const b = climbing ? 0 : Math.round(Math.sin(t * 10) * 0.6);
  px(c, "#000", x - 5, y - 23 + b, 10, 22);
  px(c, "#5a3b22", x - 4, y - 22 + b, 8, 4); // cabelo
  px(c, "#f0c49a", x - 4, y - 18 + b, 8, 5); // rosto
  if (!climbing) {
    px(c, "#1a1a2a", x - 2, y - 16 + b, 1, 1);
    px(c, "#1a1a2a", x + 1, y - 16 + b, 1, 1);
  }
  for (let i = 0; i < 5; i++) px(c, i % 2 ? "#f4f0e0" : "#c8322f", x - 5 + i * 2, y - 13 + b, 2, 2); // cachecol
  px(c, "#c8322f", x + 3, y - 12 + b + Math.sin(t * 8), 3, 4);
  px(c, "#2c8a8c", x - 5, y - 11 + b, 10, 6); // camisa
  if (climbing) {
    px(c, "#f0c49a", x - 7, y - 22, 2, 4);
    px(c, "#f0c49a", x + 5, y - 22, 2, 4);
  } else {
    px(c, "#f0c49a", x - 7, y - 10 + b, 2, 4);
    px(c, "#f0c49a", x + 5, y - 10 + b, 2, 4);
  }
  px(c, "#2b2b4a", x - 4, y - 5, 3, 4);
  px(c, "#2b2b4a", x + 1, y - 5, 3, 4);
  px(c, "#3a2414", x - 4, y - 1, 3, 1);
  px(c, "#3a2414", x + 1, y - 1, 3, 1);
}

function drawPillarMan(c: CanvasRenderingContext2D, x: number, y: number, kind: "esidisi" | "wamuu" | "kars", t: number, back = false) {
  const skin = kind === "wamuu" ? "#a87a5a" : kind === "esidisi" ? "#c99a74" : "#d8b08a";
  const hair = kind === "kars" ? "#1c1030" : kind === "wamuu" ? "#2a2a2a" : "#3a2010";
  const b = Math.round(Math.sin(t * 3) * 1);
  px(c, "#000", x - 8, y - 33 + b, 16, 33);
  px(c, hair, x - 7, y - 32 + b, 14, 6);
  if (kind === "kars") {
    px(c, hair, x - 8, y - 28 + b, 3, 14);
    px(c, hair, x + 5, y - 28 + b, 3, 14);
  }
  px(c, skin, x - 5, y - 27 + b, 10, 7);
  if (!back) {
    px(c, "#ff2a3a", x - 3, y - 24 + b, 2, 1);
    px(c, "#ff2a3a", x + 1, y - 24 + b, 2, 1);
  }
  if (kind === "wamuu") px(c, "#e8d070", x - 6, y - 30 + b, 12, 2); // tiara
  if (kind === "esidisi") px(c, "#e8d070", x - 2, y - 31 + b, 4, 3);
  px(c, skin, x - 7, y - 20 + b, 14, 9); // torso
  px(c, kind === "kars" ? "#5a2a7a" : "#7a2a2a", x - 7, y - 12 + b, 14, 3);
  px(c, "#e8d070", x - 7, y - 12 + b, 14, 1);
  px(c, skin, x - 10, y - 19 + b, 3, 9);
  px(c, skin, x + 7, y - 19 + b, 3, 9);
  px(c, "#3a2a40", x - 6, y - 9, 5, 8);
  px(c, "#3a2a40", x + 1, y - 9, 5, 8);
  if (back) px(c, "#ffd84a", x - 2, y - 17 + b, 4, 4); // ponto fraco
}

function drawKarsSupreme(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const f = Math.sin(t * 6) * 6;
  c.fillStyle = "#f2efe6";
  c.beginPath();
  c.moveTo(x - 4, y - 18);
  c.lineTo(x - 30, y - 30 - f);
  c.lineTo(x - 26, y - 12 - f / 2);
  c.lineTo(x - 18, y - 6);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + 4, y - 18);
  c.lineTo(x + 30, y - 30 - f);
  c.lineTo(x + 26, y - 12 - f / 2);
  c.lineTo(x + 18, y - 6);
  c.closePath();
  c.fill();
  c.strokeStyle = "#8a8070";
  c.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(x - 6, y - 16);
    c.lineTo(x - 8 - i * 6, y - 26 - f + i * 3);
    c.moveTo(x + 6, y - 16);
    c.lineTo(x + 8 + i * 6, y - 26 - f + i * 3);
    c.stroke();
  }
  c.save();
  c.globalAlpha = 0.35;
  c.fillStyle = "#ffe080";
  c.beginPath();
  c.arc(x, y - 16, 20, 0, Math.PI * 2);
  c.fill();
  c.restore();
  drawPillarMan(c, x, y, "kars", t);
}

function drawFish(c: CanvasRenderingContext2D, x: number, y: number, a: number) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  px(c, "#c04040", -4, -2, 7, 4);
  px(c, "#802020", -6, -3, 2, 6);
  px(c, "#fff", 2, -1, 1, 1);
  px(c, "#fff", 3, 1, 1, 1);
  c.restore();
}

/* ---------- áudio ---------- */
function blip(freq: number, dur = 0.12, type: OscillatorType = "square") {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
    o.onended = () => void ctx.close();
  } catch {
    /* opcional */
  }
}

/* ---------- estado do jogo ---------- */
type Jet = { x: number; y: number; vy: number };
type Ball = { x: number; y: number; vx: number; vy: number; bounced: boolean };
type Blade = { horiz: boolean; pos: number; t: number };
type Zone = { x: number; y: number; t: number };
type Fish = { x: number; y: number; vx: number; vy: number; life: number };
type Beam = { x: number; t: number };
type Gust = { y: number; x: number; dir: number; warn: number };

type Game = {
  t: number;
  px: number;
  py: number;
  hp: number;
  maxHp: number;
  hurt: number;
  shake: number;
  msg: string;
  msgT: number;
  // pilar
  holding: boolean;
  grip: number;
  jets: Jet[];
  jetT: number;
  base: number;
  // esidisi
  round: number;
  phase: "warn" | "burst";
  phaseT: number;
  safe: number[];
  // wamuu
  balls: Ball[];
  hits: number;
  cool: number;
  gusts: Gust[];
  gustT: number;
  wx: number;
  // kars
  blades: Blade[];
  bladeT: number;
  freeze: number;
  stone: boolean;
  bluffCool: number;
  // vulcão
  kx: number;
  zones: Zone[];
  fish: Fish[];
  beams: Beam[];
  atkT: number;
  nodes: boolean[];
  nodeAt: number;
  // cinema
  ct: number;
  over: boolean;
};

const PILLAR = 1440; // 24 m → 60 px/m
const SECTION = 360;
const HOOKS = [30, 88, 146];
const NODES = [
  { x: 30, y: 196 },
  { x: 146, y: 212 },
  { x: 88, y: 246 },
];
const GRID = { cols: 5, rows: 6, cell: 32, ox: 8, oy: 64 };

function fresh(stage: Stage): Game {
  const g: Game = {
    t: 0, px: 88, py: 230, hp: 3, maxHp: 3, hurt: 0, shake: 0, msg: "", msgT: 0,
    holding: false, grip: 0, jets: [], jetT: 1, base: PILLAR,
    round: 0, phase: "warn", phaseT: 2, safe: [],
    balls: [], hits: 0, cool: 0, gusts: [], gustT: 1.5, wx: 88,
    blades: [], bladeT: 1.2, freeze: 0, stone: false, bluffCool: 2,
    kx: 88, zones: [], fish: [], beams: [], atkT: 1.5, nodes: [false, false, false], nodeAt: 12,
    ct: 0, over: false,
  };
  if (stage === "pillar") { g.py = PILLAR; g.hp = 99; }
  if (stage === "esidisi") { g.px = 88; g.py = 230; g.safe = pickSafe(4); g.phaseT = 2.2; }
  if (stage === "volcano") { g.hp = 6; g.maxHp = 6; g.py = 225; }
  if (stage === "kars") { g.hp = 4; g.maxHp = 4; }
  return g;
}

function pickSafe(n: number) {
  const all = Array.from({ length: GRID.cols * GRID.rows }, (_, i) => i);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i]!;
    all[i] = all[j]!;
    all[j] = tmp;
  }
  return all.slice(0, n);
}

type UI = {
  hp: number;
  maxHp: number;
  label: string;
  nearNode: boolean;
  nodes: number;
  hits: number;
  round: number;
  freeze: number;
  stone: boolean;
  bluffReady: boolean;
  msg: string;
};

export function BattleTendency({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage>("prologue");
  const G = useRef<Game>(fresh("prologue"));
  const paused = useRef(true);
  const input = useRef({ x: 0, y: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const baseRef = useRef<HTMLDivElement>(null);
  const [stage, setStageState] = useState<Stage>("prologue");
  const [card, setCard] = useState<Card>(null);
  const [typed, setTyped] = useState(0);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [bluff, setBluff] = useState<{ idx: number; reply: string | null } | null>(null);
  const [ui, setUi] = useState<UI>({ hp: 3, maxHp: 3, label: "", nearNode: false, nodes: 0, hits: 0, round: 0, freeze: 0, stone: false, bluffReady: false, msg: "" });
  const [endPage, setEndPage] = useState(0);

  const goStage = useCallback((s: Stage) => {
    stageRef.current = s;
    G.current = fresh(s);
    setStageState(s);
    if (CARDS[s]) {
      paused.current = true;
      setCard(CARDS[s]);
    } else paused.current = s === "prologue" || s === "ending" || s === "done";
  }, []);

  const flash = (g: Game, m: string) => {
    g.msg = m;
    g.msgT = 1.6;
  };

  const damage = useCallback((g: Game, m: string) => {
    if (g.hurt > 0) return;
    g.hp -= 1;
    g.hurt = 1;
    g.shake = 0.3;
    blip(140, 0.25, "sawtooth");
    flash(g, m);
    if (g.hp <= 0) {
      paused.current = true;
      g.over = true;
      setCard({ title: "JOSEPH CAIU!", sub: "\"Sua próxima linha será: 'Vou tentar de novo!'\"", btn: "TENTAR NOVAMENTE", retry: true });
    }
  }, []);

  /* prólogo: máquina de escrever */
  useEffect(() => {
    if (stage !== "prologue" || typed >= PROLOGUE.length) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 32);
    return () => window.clearTimeout(id);
  }, [stage, typed]);

  /* teclado */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.key === " " && !e.repeat) { e.preventDefault(); pressAction(); }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
      if (e.key === " ") releaseAction();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  /* ação principal (contextual) */
  const pressAction = () => {
    const g = G.current;
    const s = stageRef.current;
    if (paused.current) return;
    if (s === "pillar") {
      const m = (Math.sin(g.t * 2.4) + 1) / 2;
      const zoneW = 0.24 - Math.floor((PILLAR - g.py) / SECTION) * 0.03;
      if (Math.abs(m - 0.5) < zoneW / 2) {
        g.holding = true;
        g.grip = 2.4;
        blip(880, 0.1, "triangle");
        flash(g, "CONCENTRAÇÃO PERFEITA!");
      } else {
        slip(g, "RITMO ERRADO! ESCORREGOU!");
      }
    } else if (s === "wamuu" && g.cool <= 0) {
      g.balls.push({ x: g.px, y: g.py - 20, vx: 0, vy: -230, bounced: false });
      g.cool = 0.55;
      blip(600, 0.08);
    } else if (s === "kars" && g.bluffCool <= 0 && g.freeze <= 0) {
      paused.current = true;
      setBluff({ idx: Math.floor(Math.random() * BLUFFS.length), reply: null });
    } else if (s === "volcano") {
      const i = nearNodeIdx(g);
      if (i >= 0) {
        g.nodes[i] = true;
        g.nodeAt = g.t + 14;
        g.shake = 0.5;
        blip(220, 0.5, "sawtooth");
        flash(g, `NÓ VULCÂNICO ${g.nodes.filter(Boolean).length}/3 ATIVADO!`);
      }
    }
  };
  const releaseAction = () => {
    G.current.holding = false;
  };

  const slip = (g: Game, m: string) => {
    g.py = g.base;
    g.holding = false;
    g.grip = 0;
    g.jets = [];
    g.shake = 0.3;
    blip(160, 0.3, "sawtooth");
    flash(g, m);
  };

  const nearNodeIdx = (g: Game) => {
    const active = g.nodes.findIndex((n) => !n);
    if (active < 0 || g.t < g.nodeAt) return -1;
    const n = NODES[active]!;
    return Math.hypot(g.px - n.x, g.py - n.y) < 20 ? active : -1;
  };

  /* loop principal */
  useEffect(() => {
    const cv = canvasRef.current;
    const c = cv?.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    let lastUi = "";
    const stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() }));

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = G.current;
      const s = stageRef.current;
      const run = !paused.current;
      let ix = input.current.x;
      let iy = input.current.y;
      const k = keys.current;
      if (k["ArrowLeft"] || k["a"]) ix = -1;
      if (k["ArrowRight"] || k["d"]) ix = 1;
      if (k["ArrowUp"] || k["w"]) iy = -1;
      if (k["ArrowDown"] || k["s"]) iy = 1;
      const mag = Math.hypot(ix, iy);
      const nx = mag > 0.15 ? ix / Math.max(1, mag) : 0;
      const ny = mag > 0.15 ? iy / Math.max(1, mag) : 0;

      if (run || s === "cinema") g.t += dt;
      if (run) {
        g.hurt = Math.max(0, g.hurt - dt);
        g.msgT = Math.max(0, g.msgT - dt);
      }
      g.shake = Math.max(0, g.shake - dt);

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, H);
      if (g.shake > 0) c.translate(rnd(-2, 2), rnd(-2, 2));

      /* ================= PILAR ================= */
      if (s === "pillar") {
        if (run) {
          g.px = clamp(g.px + nx * 45 * dt, 56, 120);
          const sec = Math.floor((PILLAR - g.py) / SECTION);
          g.base = PILLAR - sec * SECTION;
          if (g.holding && g.grip > 0) {
            g.grip -= dt;
            if (ny < 0) g.py += ny * 48 * dt;
            if (g.grip <= 0) { g.holding = false; flash(g, "FÔLEGO ESGOTADO! RESPIRE E REPITA!"); }
          } else if (g.py < g.base) {
            g.py = Math.min(g.base, g.py + 30 * dt);
          }
          g.jetT -= dt;
          const camY0 = clamp(g.py - 190, 0, PILLAR - H + 40);
          if (g.jetT <= 0) {
            g.jets.push({ x: rnd(54, 122), y: camY0 - 10, vy: rnd(120, 170) + sec * 25 });
            g.jetT = rnd(0.55, 1.0) - sec * 0.08;
          }
          for (const j of g.jets) j.y += j.vy * dt;
          g.jets = g.jets.filter((j) => j.y < camY0 + H + 20);
          if (g.jets.some((j) => Math.abs(j.x - g.px) < 7 && j.y > g.py - 24 && j.y < g.py)) {
            slip(g, "ATINGIDO PELO ÓLEO!");
          }
          if (g.py <= 24) {
            paused.current = true;
            blip(1200, 0.4, "triangle");
            setCard({ title: "TREINAMENTO CONCLUÍDO!", sub: "Lisa Lisa: \"Nada mal, JoJo. Agora vá a Roma... os Homens do Pilar despertaram.\"", btn: "SEGUIR PARA ROMA" });
            stageRef.current = "esidisi";
          }
        }
        const camY = clamp(g.py - 190, 0, PILLAR - H + 40);
        // fundo de pedra
        px(c, "#1a1424", 0, 0, W, H);
        for (let y = -((camY * 0.5) % 24); y < H; y += 24)
          for (let x = 0; x < W; x += 32) {
            px(c, "#241c30", x + ((y / 24) % 2 ? 16 : 0) - 16, y, 30, 22);
          }
        c.translate(0, -camY);
        // pilar
        px(c, "#000", 46, 0, 84, PILLAR + 40);
        px(c, "#6b5a48", 48, 0, 80, PILLAR + 40);
        for (let y = 0; y < PILLAR + 40; y += 20) px(c, "#5a4a3a", 48, y, 80, 1);
        const sh = (g.t * 40) % 60;
        for (let y = -60 + sh; y < PILLAR + 40; y += 60) {
          c.fillStyle = "rgba(255,230,140,0.25)";
          c.fillRect(60, y, 4, 34);
          c.fillRect(108, y + 20, 3, 26);
        }
        for (let i = 1; i <= 4; i++) {
          const y = PILLAR - i * SECTION;
          px(c, "#e8c060", 44, y, 88, 3);
          c.fillStyle = "#e8c060";
          c.font = "7px monospace";
          c.fillText(`${i * 6}m`, 4, y + 3);
        }
        px(c, "#3a2a20", 30, PILLAR, 116, 40);
        px(c, "#e8c060", 40, -2, 96, 6);
        for (const j of g.jets) {
          px(c, "#2a2010", j.x - 3, j.y - 12, 6, 14);
          px(c, "#c8a040", j.x - 2, j.y - 10, 4, 10);
        }
        drawJoseph(c, g.px, g.py, g.t, true);
        c.setTransform(1, 0, 0, 1, 0, 0);
        // HUD foco de Hamon
        const m = (Math.sin(g.t * 2.4) + 1) / 2;
        const sec = Math.floor((PILLAR - g.py) / SECTION);
        const zoneW = 0.24 - sec * 0.03;
        px(c, "#000", 18, 8, 140, 12);
        px(c, "#2a1a40", 20, 10, 136, 8);
        px(c, "#e8c060", 20 + 136 * (0.5 - zoneW / 2), 10, 136 * zoneW, 8);
        px(c, "#fff", 20 + 136 * m - 1, 7, 3, 14);
        px(c, "#000", 18, 22, 140, 5);
        px(c, "#60e0ff", 20, 23, 136 * clamp(g.grip / 2.4, 0, 1), 3);
        c.fillStyle = "#f4e6b0";
        c.font = "7px monospace";
        c.fillText("FOCO DE HAMON", 20, 36);
        c.fillText(`${((PILLAR - g.py) / 60).toFixed(1)}m / 24m`, 112, 36);
      }

      /* ================= ESIDISI ================= */
      if (s === "esidisi") {
        if (run) {
          g.px = clamp(g.px + nx * 80 * dt, GRID.ox + 6, GRID.ox + GRID.cols * GRID.cell - 6);
          g.py = clamp(g.py + ny * 80 * dt, GRID.oy + 10, GRID.oy + GRID.rows * GRID.cell);
          g.phaseT -= dt;
          if (g.phaseT <= 0) {
            if (g.phase === "warn") {
              g.phase = "burst";
              g.phaseT = 0.8;
              g.shake = 0.2;
              blip(90, 0.4, "sawtooth");
              const col = Math.floor((g.px - GRID.ox) / GRID.cell);
              const row = Math.floor((g.py - 4 - GRID.oy) / GRID.cell);
              if (!g.safe.includes(row * GRID.cols + col)) damage(g, "O CACHECOL QUEIMOU!");
              else flash(g, "ESQUIVA!");
            } else {
              g.round += 1;
              if (g.round >= 7) {
                paused.current = true;
                setCard({ title: "ESIDISI DERROTADO", sub: "Esidisi: \"AAAHHH! AH-AH-AH! Chorar me acalma...\" Mas Whamuu entra na arena!", btn: "CONTINUAR" });
                stageRef.current = "wamuu";
              } else {
                g.phase = "warn";
                g.phaseT = Math.max(1.0, 2.2 - g.round * 0.18);
                g.safe = pickSafe(Math.max(2, 4 - Math.floor(g.round / 2)));
              }
            }
          }
        }
        px(c, "#100810", 0, 0, W, H);
        for (let r = 0; r < GRID.rows; r++)
          for (let col = 0; col < GRID.cols; col++) {
            const i = r * GRID.cols + col;
            const x = GRID.ox + col * GRID.cell;
            const y = GRID.oy + r * GRID.cell;
            const safe = g.safe.includes(i);
            let color = (r + col) % 2 ? "#2a2030" : "#241a2a";
            if (g.phase === "warn" && safe && Math.floor(g.t * 8) % 2) color = "#3aa860";
            if (g.phase === "warn" && safe) color = Math.floor(g.t * 8) % 2 ? "#3aa860" : "#1f5a34";
            if (g.phase === "burst" && !safe) color = Math.floor(g.t * 20) % 2 ? "#c01828" : "#ff4040";
            if (g.phase === "burst" && safe) color = "#1f5a34";
            px(c, color, x + 1, y + 1, GRID.cell - 2, GRID.cell - 2);
            if (g.phase === "burst" && !safe) {
              px(c, "#ff8080", x + 12, y + 4 - ((g.t * 60) % 20), 4, 10);
              c.fillStyle = "rgba(255,200,200,0.4)";
              c.fillRect(x + 6, y + 2, 2, 6);
            }
          }
        drawPillarMan(c, 88, 52, "esidisi", g.t);
        for (let i = 0; i < 6; i++) {
          const a = g.t * 2 + i;
          px(c, "#c01828", 88 + Math.cos(a) * 16, 34 + Math.sin(a) * 8, 2, 2);
        }
        drawJoseph(c, g.px, g.py, g.t, false, g.hurt > 0);
        c.fillStyle = "#f4e6b0";
        c.font = "7px monospace";
        c.fillText(`RODADA ${Math.min(7, g.round + 1)}/7`, 6, 12);
        c.fillText(g.phase === "warn" ? "VÁ PARA O VERDE!" : "SANGUE FERVENTE!", 90, 12);
      }

      /* ================= WHAMUU ================= */
      if (s === "wamuu") {
        if (run) {
          const wind = Math.sin(g.t * 0.9) * 26;
          g.px = clamp(g.px + (nx * 80 + wind) * dt, 12, 164);
          g.py = clamp(g.py + ny * 80 * dt, 160, 256);
          g.wx = 88 + Math.sin(g.t * 0.8) * 58;
          g.cool -= dt;
          for (const b of g.balls) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (!b.bounced && b.y < 92 && b.y > 70 && Math.abs(b.x - g.wx) < 12) {
              b.y = -99;
              flash(g, "WHAMUU DESVIA! USE OS GANCHOS!");
            }
            if (!b.bounced && b.y <= 30) {
              const hook = HOOKS.find((h) => Math.abs(h - b.x) < 8);
              if (hook !== undefined) {
                b.bounced = true;
                const dx = Math.abs(g.wx - hook) < 64 ? g.wx - hook : (hook - b.x) * 10 + 70 * Math.sign(hook - b.x || 1);
                const len = Math.hypot(dx, 46);
                b.vx = (dx / len) * 230;
                b.vy = (46 / len) * 230;
                b.y = 30;
                blip(1000, 0.06);
              } else b.y = -99;
            }
            if (b.bounced && Math.abs(b.y - 76) < 8 && Math.abs(b.x - g.wx) < 13) {
              b.y = 999;
              g.hits += 1;
              g.shake = 0.4;
              blip(300, 0.3, "sawtooth");
              flash(g, `ACERTOU AS COSTAS! ${g.hits}/3`);
              if (g.hits >= 3) {
                paused.current = true;
                setCard({ title: "WHAMUU CESSA O GOLPE", sub: "Whamuu: \"Você tem o espírito de um guerreiro, JoJo.\" Agora, o líder... Kars.", btn: "CONTINUAR" });
                stageRef.current = "kars";
              }
            }
          }
          g.balls = g.balls.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -10 && b.x < W + 10);
          g.gustT -= dt;
          if (g.gustT <= 0) {
            const dir = Math.random() < 0.5 ? 1 : -1;
            g.gusts.push({ y: rnd(168, 250), x: dir > 0 ? -20 : W + 20, dir, warn: 0.8 });
            g.gustT = rnd(1.0, 1.8) - g.hits * 0.2;
          }
          for (const q of g.gusts) {
            if (q.warn > 0) q.warn -= dt;
            else q.x += q.dir * 170 * dt;
            if (q.warn <= 0 && Math.abs(q.x - g.px) < 10 && Math.abs(q.y - (g.py - 10)) < 10) damage(g, "LÂMINA DE VENTO!");
          }
          g.gusts = g.gusts.filter((q) => q.x > -30 && q.x < W + 30);
        }
        c.setTransform(1, 0, Math.sin(g.t * 2.2) * 0.05, 1, 0, 0);
        px(c, "#18121c", -20, 0, W + 40, H);
        px(c, "#2a2028", -20, 0, W + 40, 22);
        for (const h of HOOKS) {
          px(c, "#999", h - 1, 14, 2, 10);
          px(c, "#ddd", h - 4, 24, 8, 3);
          c.strokeStyle = "rgba(232,192,96,0.25)";
          c.setLineDash([2, 3]);
          c.beginPath();
          c.moveTo(h, 28);
          c.lineTo(h, 150);
          c.stroke();
          c.setLineDash([]);
        }
        for (let i = 0; i < 26; i++) {
          const a = g.t * 3 + i * 0.7;
          const rr = 20 + (i % 7) * 12;
          c.fillStyle = "rgba(210,180,120,0.35)";
          c.fillRect(g.wx + Math.cos(a) * rr, 120 + Math.sin(a) * rr * 0.5, 2, 1);
        }
        drawPillarMan(c, g.wx, 92, "wamuu", g.t, true);
        for (const q of g.gusts) {
          if (q.warn > 0) {
            c.fillStyle = `rgba(255,60,60,${0.2 + Math.sin(g.t * 30) * 0.15})`;
            c.fillRect(0, q.y - 3, W, 6);
          } else {
            px(c, "#e8d8a0", q.x - 10, q.y - 1, 20, 2);
            px(c, "#fff", q.x - 4, q.y - 2, 8, 4);
          }
        }
        for (const b of g.balls) {
          px(c, "#000", b.x - 3, b.y - 3, 6, 6);
          px(c, "#cfd8e8", b.x - 2, b.y - 2, 4, 4);
          px(c, "#fff", b.x - 1, b.y - 2, 1, 1);
        }
        drawJoseph(c, g.px, g.py, g.t, false, g.hurt > 0);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.fillStyle = "#f4e6b0";
        c.font = "7px monospace";
        c.fillText(`COSTAS ATINGIDAS ${g.hits}/3`, 6, 266);
      }

      /* ================= KARS ================= */
      if (s === "kars") {
        if (run) {
          g.px = clamp(g.px + nx * 82 * dt, 12, 164);
          g.py = clamp(g.py + ny * 82 * dt, 60, 256);
          g.bluffCool -= dt;
          if (g.freeze > 0) {
            g.freeze -= dt;
            if (!g.stone && Math.hypot(g.px - 88, g.py - 160) < 12) {
              g.stone = true;
              blip(1400, 0.3, "triangle");
              flash(g, "PEDRA DE AJA OBTIDA! FUJA!");
            }
            if (g.stone && g.py < 70 && Math.abs(g.px - 88) < 16) {
              paused.current = true;
              setCard({ title: "FUGA PERFEITA!", sub: "Kars: \"JOJOOOO! A Pedra de Aja...!\" A perseguição termina num vulcão em erupção.", btn: "IR AO VULCÃO" });
              stageRef.current = "volcano";
            }
            if (g.freeze <= 0 && !(g.stone && g.py < 70)) {
              g.stone = false;
              g.bluffCool = 2.5;
              flash(g, "KARS SE RECOMPÔS! BLEFE DE NOVO!");
            }
          } else {
            g.bladeT -= dt;
            if (g.bladeT <= 0) {
              const horiz = Math.random() < 0.5;
              g.blades.push({ horiz, pos: horiz ? clamp(g.py - 10 + rnd(-20, 20), 70, 250) : clamp(g.px + rnd(-24, 24), 12, 164), t: 0 });
              g.bladeT = rnd(0.7, 1.3);
            }
          }
          for (const b of g.blades) {
            if (g.freeze <= 0) b.t += dt;
            if (b.t > 0.75 && b.t < 0.95) {
              const hit = b.horiz ? Math.abs(g.py - 10 - b.pos) < 8 : Math.abs(g.px - b.pos) < 7;
              if (hit) damage(g, "LÂMINA DE LUZ!");
            }
          }
          g.blades = g.blades.filter((b) => b.t < 1);
        }
        px(c, "#0e0a14", 0, 0, W, H);
        for (let y = 60; y < H; y += 16) for (let x = 0; x < W; x += 16) px(c, (x + y) % 32 ? "#1c1626" : "#18121f", x, y, 16, 16);
        px(c, g.stone ? "#e8c060" : "#3a2a20", 70, 44, 36, 18);
        px(c, "#000", 74, 48, 28, 14);
        c.fillStyle = "#f4e6b0";
        c.font = "6px monospace";
        c.fillText("SAÍDA", 79, 42);
        drawPillarMan(c, 88, 100, "kars", g.freeze > 0 ? 0 : g.t);
        if (g.freeze > 0) {
          c.fillStyle = "#ff6a6a";
          c.font = "bold 9px monospace";
          c.fillText("!?", 96, 66);
          if (!g.stone) {
            const pulse = 2 + Math.sin(g.t * 10);
            c.fillStyle = "rgba(255,40,60,0.4)";
            c.beginPath();
            c.arc(88, 160, 8 + pulse, 0, Math.PI * 2);
            c.fill();
            px(c, "#ff2040", 85, 157, 6, 6);
            px(c, "#ffb0b0", 86, 158, 2, 2);
          }
        }
        for (const b of g.blades) {
          const warn = b.t < 0.75;
          c.fillStyle = warn ? `rgba(255,255,160,${0.15 + 0.2 * Math.sin(b.t * 40)})` : "#fffbe0";
          if (b.horiz) c.fillRect(0, b.pos - (warn ? 1 : 3), W, warn ? 2 : 6);
          else c.fillRect(b.pos - (warn ? 1 : 3), 60, warn ? 2 : 6, H);
        }
        drawJoseph(c, g.px, g.py, g.t, false, g.hurt > 0);
        if (g.freeze > 0) {
          c.fillStyle = "#ffe080";
          c.font = "bold 12px monospace";
          c.fillText(g.freeze.toFixed(1) + "s", 74, 140);
        }
      }

      /* ================= VULCÃO ================= */
      if (s === "volcano") {
        const lvl = g.nodes.filter(Boolean).length;
        if (run) {
          g.px = clamp(g.px + nx * 85 * dt, 22, 154);
          g.py = clamp(g.py + ny * 85 * dt, 168, 256);
          g.kx += (g.px - g.kx) * dt * 1.2;
          g.atkT -= dt;
          if (g.atkT <= 0) {
            const roll = Math.random();
            if (roll < 0.45) {
              for (let i = 0; i < 1 + lvl; i++) g.zones.push({ x: clamp(g.px + rnd(-30, 30), 22, 154), y: clamp(g.py - 8 + rnd(-20, 20), 168, 250), t: 0 });
            } else if (roll < 0.75) {
              for (let i = 0; i < 2 + lvl; i++) {
                const a = Math.atan2(g.py - 60, g.px - g.kx) + rnd(-0.5, 0.5);
                g.fish.push({ x: g.kx, y: 60, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 4 });
              }
              blip(500, 0.1);
            } else {
              g.beams.push({ x: clamp(g.px + rnd(-10, 10), 22, 154), t: 0 });
            }
            g.atkT = rnd(0.7, 1.3) - lvl * 0.12;
          }
          for (const z of g.zones) {
            z.t += dt;
            if (z.t > 1.1 && z.t < 1.3 && Math.hypot(g.px - z.x, g.py - 8 - z.y) < 14) damage(g, "IMPACTO!");
          }
          g.zones = g.zones.filter((z) => z.t < 1.4);
          for (const f of g.fish) {
            const a = Math.atan2(g.py - 10 - f.y, g.px - f.x);
            f.vx += Math.cos(a) * 30 * dt;
            f.vy += Math.sin(a) * 30 * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.life -= dt;
            if (Math.hypot(f.x - g.px, f.y - (g.py - 10)) < 7) {
              f.life = 0;
              damage(g, "PIRANHA DE PENA!");
            }
          }
          g.fish = g.fish.filter((f) => f.life > 0);
          for (const b of g.beams) {
            b.t += dt;
            if (b.t > 0.8 && b.t < 1.1 && Math.abs(g.px - b.x) < 8) damage(g, "TENTÁCULO DE LUZ!");
          }
          g.beams = g.beams.filter((b) => b.t < 1.15);
        }
        // fundo
        const grd = c.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, "#2a0a12");
        grd.addColorStop(0.5, "#5a1a10");
        grd.addColorStop(1, "#1a0806");
        c.fillStyle = grd;
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 20; i++) {
          const y = (H - ((g.t * 30 + i * 37) % H));
          px(c, "#ff9a30", (i * 53) % W, y, 1, 2);
        }
        px(c, "#3a1a14", 14, 160, 148, 112);
        for (let y = 160; y < H; y += 12) for (let x = 14; x < 162; x += 18) px(c, "#2a120e", x + ((y / 12) % 2) * 9, y, 16, 1);
        // lava subindo nas bordas
        const rise = Math.sin(g.t * 1.5) * 6;
        for (let y = 0; y < H; y += 4) {
          const wv = Math.sin(y * 0.15 + g.t * 4) * 3;
          px(c, "#ff4a10", 0, y, 12 + wv + rise * (y / H), 4);
          px(c, "#ff4a10", W - 12 - wv - rise * (y / H), y, 14 + wv, 4);
          px(c, "#ffd040", 0, y, 5 + wv, 2);
          px(c, "#ffd040", W - 5 - wv, y, 5, 2);
        }
        // nós
        NODES.forEach((n, i) => {
          const done = g.nodes[i];
          const active = !done && g.nodes.findIndex((v) => !v) === i && g.t >= g.nodeAt;
          px(c, "#000", n.x - 8, n.y - 5, 16, 10);
          px(c, done ? "#ffd040" : active ? (Math.floor(g.t * 6) % 2 ? "#ff6020" : "#ffb040") : "#4a2418", n.x - 7, n.y - 4, 14, 8);
          if (active) {
            c.strokeStyle = "#ffe080";
            c.beginPath();
            c.arc(n.x, n.y, 12 + Math.sin(g.t * 6) * 2, 0, Math.PI * 2);
            c.stroke();
          }
        });
        for (const z of g.zones) {
          const hit = z.t > 1.1;
          c.fillStyle = hit ? "rgba(255,240,200,0.9)" : `rgba(255,30,30,${0.25 + 0.2 * Math.sin(z.t * 25)})`;
          c.beginPath();
          c.ellipse(z.x, z.y, 14, 8, 0, 0, Math.PI * 2);
          c.fill();
        }
        drawJoseph(c, g.px, g.py, g.t, false, g.hurt > 0);
        for (const b of g.beams) {
          const warn = b.t < 0.8;
          c.fillStyle = warn ? `rgba(255,255,170,${0.15 + 0.15 * Math.sin(b.t * 40)})` : "#fffbe8";
          c.fillRect(b.x - (warn ? 2 : 5), 60, warn ? 4 : 10, H);
        }
        for (const f of g.fish) drawFish(c, f.x, f.y, Math.atan2(f.vy, f.vx));
        drawKarsSupreme(c, g.kx, 64 + Math.sin(g.t * 2) * 4, g.t);
        c.fillStyle = "#f4e6b0";
        c.font = "7px monospace";
        const nextIn = Math.max(0, g.nodeAt - g.t);
        c.fillText(lvl >= 3 ? "ENERGIA CONCENTRADA!" : nextIn > 0 ? `NÓ EMERGINDO EM ${nextIn.toFixed(0)}s` : "VÁ ATÉ O NÓ BRILHANTE!", 18, 150);
        if (lvl >= 3 && run) {
          g.zones = [];
          g.beams = [];
          g.fish = [];
          g.atkT = 99;
        }
      }

      /* ================= CINEMÁTICA ================= */
      if (s === "cinema") {
        const t = g.t;
        const space = clamp((t - 4.2) / 1.5, 0, 1);
        px(c, "#3a0c0a", 0, 0, W, H);
        c.fillStyle = `rgba(4,2,16,${space})`;
        c.fillRect(0, 0, W, H);
        for (const st of stars) {
          c.fillStyle = `rgba(255,255,230,${space * (0.4 + st.s * 0.6)})`;
          c.fillRect(st.x, st.y, 1, 1);
        }
        if (t < 4.2) {
          px(c, "#2a120e", 0, 200, W, 72);
          px(c, "#ff4a10", 60, 236, 56, 10);
          px(c, "#ffd040", 70, 238, 36, 4);
          drawJoseph(c, 40, 226, t);
          px(c, "#ff2040", 46, 212, 4, 4);
          drawKarsSupreme(c, 128, 90, t);
        }
        if (t > 1 && t < 4.2) {
          const grow = clamp((t - 1) / 1.2, 0, 1);
          c.strokeStyle = "#fff6c0";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(88, 238);
          c.lineTo(88 + (48 - 88) * grow, 238 + (214 - 238) * grow);
          c.stroke();
          if (t > 2.4) {
            const g2 = clamp((t - 2.4) / 0.8, 0, 1);
            c.lineWidth = 5;
            c.strokeStyle = "#ff3050";
            c.beginPath();
            c.moveTo(48, 214);
            c.lineTo(48 + (128 - 48) * g2, 214 + (78 - 214) * g2);
            c.stroke();
          }
          c.lineWidth = 1;
        }
        if (t > 3.3 && t < 4.6) {
          const e = (t - 3.3) / 1.3;
          c.fillStyle = `rgba(255,255,255,${1 - Math.abs(e - 0.5) * 2})`;
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#ffd040";
          c.beginPath();
          c.arc(128, 80, e * 120, 0, Math.PI * 2);
          c.globalAlpha = 0.5;
          c.fill();
          c.globalAlpha = 1;
        }
        if (t >= 4.2) {
          const fly = clamp((t - 4.2) / 3, 0, 1);
          c.save();
          c.translate(88, 220 - fly * 230);
          c.scale(1 - fly * 0.8, 1 - fly * 0.8);
          c.rotate(t * 3);
          drawPillarMan(c, 0, 16, "kars", t);
          c.restore();
          if (space > 0.8) {
            c.fillStyle = "#3a6ab0";
            c.beginPath();
            c.arc(88, 330, 120, 0, Math.PI * 2);
            c.fill();
          }
        }
        if (t > 7.6) {
          stageRef.current = "ending";
          setStageState("ending");
          paused.current = true;
        }
      }

      if (s === "prologue" || s === "ending" || s === "done") {
        px(c, "#0a0612", 0, 0, W, H);
        for (const st of stars) {
          c.fillStyle = `rgba(255,240,200,${0.3 + st.s * 0.5})`;
          c.fillRect(st.x, st.y, 1, 1);
        }
      }

      // mensagem flutuante
      if (g.msgT > 0 && g.msg) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.font = "bold 8px monospace";
        const w = c.measureText(g.msg).width + 10;
        c.fillStyle = "rgba(0,0,0,0.75)";
        c.fillRect((W - w) / 2, 128, w, 14);
        c.fillStyle = "#ffe080";
        c.fillText(g.msg, (W - w) / 2 + 5, 138);
      }

      const near = s === "volcano" && nearNodeIdx(g) >= 0;
      const next: UI = {
        hp: g.hp, maxHp: g.maxHp, label: "", nearNode: near, nodes: g.nodes.filter(Boolean).length,
        hits: g.hits, round: g.round, freeze: g.freeze > 0 ? 1 : 0, stone: g.stone,
        bluffReady: g.bluffCool <= 0 && g.freeze <= 0, msg: "",
      };
      const key = JSON.stringify(next);
      if (key !== lastUi) {
        lastUi = key;
        setUi(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [damage]);

  /* analógico */
  const onStick = (e: React.PointerEvent) => {
    const el = baseRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const R = b.width / 2;
    let dx = e.clientX - (b.left + R);
    let dy = e.clientY - (b.top + R);
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    input.current = { x: dx / R, y: dy / R };
    setKnob({ x: dx, y: dy });
  };
  const endStick = () => {
    input.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
  };

  const onCard = () => {
    blip(700, 0.08, "triangle");
    const c = card;
    if (!c) return;
    if (c.retry) {
      setCard(null);
      G.current = fresh(stageRef.current);
      paused.current = false;
      return;
    }
    // cartão de conclusão aponta stageRef para a próxima etapa
    if (stageRef.current !== stage) {
      goStage(stageRef.current);
      return;
    }
    setCard(null);
    paused.current = false;
  };

  const answerBluff = (i: number) => {
    if (!bluff) return;
    const q = BLUFFS[bluff.idx]!;
    const g = G.current;
    if (i === q.correct) {
      setBluff({ ...bluff, reply: `Kars: "${q.options[i]!.replace(/"/g, "")}" ...!? C-como você sabia?!` });
      blip(1100, 0.2, "triangle");
    } else {
      setBluff({ ...bluff, reply: "Kars: \"Hah! Errou, JoJo!\" (Kars contra-ataca)" });
      g.hp -= 1;
      g.bluffCool = 3;
      if (g.hp <= 0) {
        g.over = true;
      }
    }
  };
  const closeBluff = () => {
    if (!bluff) return;
    const g = G.current;
    const ok = bluff.reply?.includes("como você sabia");
    setBluff(null);
    if (ok) {
      g.freeze = 3;
      g.blades = [];
      g.bluffCool = 99;
    }
    if (g.hp <= 0) {
      setCard({ title: "JOSEPH CAIU!", sub: "Kars leu seu blefe.", btn: "TENTAR NOVAMENTE", retry: true });
      return;
    }
    paused.current = false;
  };

  const startFinal = () => {
    blip(200, 0.8, "sawtooth");
    stageRef.current = "cinema";
    G.current = fresh("cinema");
    setStageState("cinema");
    paused.current = true;
  };

  const finishPart = () => {
    const cur = Number(localStorage.getItem("jojo-unlocked") || "1");
    localStorage.setItem("jojo-unlocked", String(Math.max(cur, 3)));
    localStorage.setItem("jojo-part2-done", "1");
    stageRef.current = "done";
    setStageState("done");
    blip(1320, 0.5, "triangle");
  };

  const actionLabel =
    stage === "pillar" ? "RITMO DO HAMON" :
    stage === "wamuu" ? "ESFERAS DE AÇO" :
    stage === "kars" ? (ui.freeze ? "CORRA!" : "BLEFAR") :
    stage === "volcano" ? (ui.nodes >= 3 ? "PLANO SECRETO" : "INTERAGIR") : "—";
  const actionOn =
    stage === "pillar" || stage === "wamuu" || (stage === "kars" && ui.bluffReady) || (stage === "volcano" && ui.nearNode);
  const objective =
    stage === "pillar" ? "Subir o Pilar de Óleo (24 m)" :
    stage === "esidisi" ? `Sobreviver ao Sangue Fervente (${Math.min(7, ui.round)}/7)` :
    stage === "wamuu" ? `Acertar as costas de Whamuu (${ui.hits}/3)` :
    stage === "kars" ? (ui.stone ? "Fugir pela saída!" : "Blefar com Kars e pegar a Pedra de Aja") :
    stage === "volcano" ? `Ativar os Nós Vulcânicos (${ui.nodes}/3)` :
    "Battle Tendency";
  const showHp = ["esidisi", "wamuu", "kars", "volcano"].includes(stage);
  const playing = ["pillar", "esidisi", "wamuu", "kars", "volcano"].includes(stage);

  return (
    <section className="pb-game jojo-fade-in relative z-20 flex h-[100dvh] flex-col items-center">
      <header className="pb-hud">
        <button className="pb-icon" onClick={onExit} aria-label="Voltar ao menu">✕</button>
        <div className="pb-objective">
          <span className="pb-part">PARTE 2 · BATTLE TENDENCY</span>
          <span>◆ {objective}</span>
          {showHp && (
            <span className="bt-hp" aria-label={`Vida ${ui.hp} de ${ui.maxHp}`}>
              {Array.from({ length: ui.maxHp }, (_, i) => (i < ui.hp ? "♥" : "♡")).join(" ")}
            </span>
          )}
        </div>
        <span className="pb-icon bt-spacer" aria-hidden="true" />
      </header>

      <div className="pb-stage">
        <canvas ref={canvasRef} width={W} height={H} className="pb-canvas" />

        {stage === "prologue" && (
          <div className="pb-solved bt-prologue">
            <p className="pb-part">PRÓLOGO</p>
            <p className="bt-prologue-text">{PROLOGUE.slice(0, typed)}<span className="bt-caret">▌</span></p>
            <button
              className="jojo-btn jojo-btn-primary"
              onClick={() => (typed < PROLOGUE.length ? setTyped(PROLOGUE.length) : goStage("pillar"))}
            >
              {typed < PROLOGUE.length ? "PULAR" : "COMEÇAR"}
            </button>
          </div>
        )}

        {card && (
          <div className="pb-solved jojo-fade-in">
            <p className="pb-solved-title bt-card-title">{card.title}</p>
            <p className="pb-solved-sub">{card.sub}</p>
            <button className="jojo-btn jojo-btn-primary" onClick={onCard}>{card.btn}</button>
          </div>
        )}

        {bluff && (
          <div className="pb-dialog bt-bluff">
            <span className="pb-dialog-name">{bluff.reply ? "Resultado" : "Kars"}</span>
            {!bluff.reply ? (
              <>
                <span className="pb-dialog-text">{BLUFFS[bluff.idx]!.kars}</span>
                <span className="bt-bluff-ask">Joseph: "Sua próxima linha será..."</span>
                {BLUFFS[bluff.idx]!.options.map((o, i) => (
                  <button key={i} className="bt-option" onClick={() => answerBluff(i)}>▸ {o}</button>
                ))}
              </>
            ) : (
              <>
                <span className="pb-dialog-text">{bluff.reply}</span>
                <button className="bt-option" onClick={closeBluff}>CONTINUAR ▼</button>
              </>
            )}
          </div>
        )}

        {stage === "ending" && (
          <button className="pb-dialog" onClick={() => (endPage === 0 ? setEndPage(1) : finishPart())}>
            <span className="pb-dialog-name">Narrador</span>
            <span className="pb-dialog-text">
              {endPage === 0
                ? "Kars foi lançado ao espaço... Embora quisesse morrer, ele não conseguia."
                : "Eventualmente, Kars parou de pensar."}
            </span>
            <span className="pb-dialog-next">▼</span>
          </button>
        )}

        {stage === "done" && (
          <div className="pb-solved jojo-fade-in">
            <p className="pb-solved-title">PARTE 2 CONCLUÍDA</p>
            <div className="bt-lock" aria-hidden="true">
              <span className="bt-lock-half bt-lock-l">🔒</span>
              <span className="bt-lock-half bt-lock-r">🔒</span>
              <span className="bt-lock-burst">ドン!</span>
            </div>
            <p className="pb-solved-sub">Progresso salvo.<br />PARTE 3: Stardust Crusaders desbloqueada!</p>
            <p className="pb-tbc">TO BE CONTINUED ⟶</p>
            <button className="jojo-btn" onClick={onExit}>VOLTAR AO MENU</button>
          </div>
        )}
      </div>

      <div className="pb-controls" style={{ visibility: playing ? "visible" : "hidden" }}>
        <div
          ref={baseRef}
          className="pb-stick"
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); onStick(e); }}
          onPointerMove={(e) => e.buttons && onStick(e)}
          onPointerUp={endStick}
          onPointerCancel={endStick}
        >
          <div className="pb-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
        </div>
        {stage === "volcano" && ui.nodes >= 3 ? (
          <button className="pb-interact pb-interact-on bt-final" onClick={startFinal}>
            PLANO SECRETO FINAL
          </button>
        ) : (
          <button
            className={`pb-interact ${actionOn ? "pb-interact-on" : ""}`}
            disabled={stage === "esidisi" || (!actionOn && stage !== "pillar")}
            onPointerDown={(e) => { e.preventDefault(); pressAction(); }}
            onPointerUp={releaseAction}
            onPointerLeave={releaseAction}
            onPointerCancel={releaseAction}
          >
            {stage === "esidisi" ? "ESQUIVE!" : actionLabel}
            {stage === "pillar" && <small>toque e segure</small>}
          </button>
        )}
      </div>
    </section>
  );
}
