import { useCallback, useEffect, useRef, useState } from "react";
import dioPortrait from "@/assets/dio-portrait.png";

/* ================== MAPA ================== */
const T = 16;
const COLS = 11;
const ROWS = 17;
const W = COLS * T;
const H = ROWS * T;

type Rect = { x: number; y: number; w: number; h: number };
type Thing = {
  id: string;
  name: string;
  rect: Rect; // em tiles
  lines: string[];
  diary?: boolean;
};

const r = (x: number, y: number, w: number, h: number): Rect => ({ x: x * T, y: y * T, w: w * T, h: h * T });

const THINGS: Thing[] = [
  {
    id: "fire",
    name: "Lareira",
    rect: r(4, 1, 3, 1.7),
    lines: [
      "As chamas estalam na lareira de mármore.",
      "Entre as cinzas há pedaços de cartas queimadas... a letra é de Dio.",
      "Ele queimou as cartas — mas nunca queimaria o próprio diário. Está escondido em algum móvel.",
    ],
  },
  {
    id: "shelfL",
    name: "Estante",
    rect: r(1, 1, 3, 1.6),
    lines: ["Livros de medicina e botânica.", "Um volume sobre venenos orientais está fora do lugar... mas não há diário aqui."],
  },
  {
    id: "shelfR",
    name: "Estante",
    rect: r(7, 1, 3, 1.6),
    lines: ["Obras de arqueologia asteca.", "Uma gravura de uma estranha Máscara de Pedra está marcada. Arrepiante..."],
  },
  {
    id: "shelfSide",
    name: "Estante Lateral",
    rect: r(1, 5, 1, 4),
    lines: ["Clássicos ingleses empoeirados. Ninguém toca nesses livros há anos."],
  },
  {
    id: "table",
    name: "Mesa de Jantar",
    rect: r(4, 7, 3, 2),
    lines: [
      "Uma mesa de mogno com candelabros acesos.",
      "Há uma xícara de chá do Pai ainda morna... com um cheiro amargo estranho.",
    ],
  },
  {
    id: "sofa",
    name: "Sofá",
    rect: r(4, 10.5, 3, 1),
    lines: ["Você procura entre as almofadas de veludo.", "Apenas as luvas de Dio. Ele esteve sentado aqui ontem à noite, olhando para o relógio."],
  },
  {
    id: "armor",
    name: "Armadura",
    rect: r(9, 9, 1, 1.5),
    lines: ["Uma armadura medieval da família Joestar.", "O elmo está vazio. Nada escondido."],
  },
  {
    id: "desk",
    name: "Escrivaninha",
    rect: r(8, 12, 2, 1.5),
    lines: [
      "A escrivaninha de Dio. A gaveta está vazia.",
      "Um bilhete amassado: \"Quando o relógio bater três vezes, ninguém verá meus segredos.\"",
    ],
  },
  {
    id: "piano",
    name: "Piano",
    rect: r(1, 12, 2, 2),
    lines: ["Um piano de cauda. Algumas teclas estão desafinadas.", "Nada dentro dele além de poeira."],
  },
  {
    id: "clock",
    name: "Relógio de Pêndulo",
    rect: r(9, 5, 1, 2),
    diary: true,
    lines: [
      "O relógio de pêndulo está parado às 3 horas.",
      "Você abre a portinhola... atrás do pêndulo há um caderno de couro negro!",
      "É O DIÁRIO DE DIO BRANDO!",
      "\"...O velho Joestar está ficando fraco. Mais algumas doses e a fortuna será minha.\"",
      "\"...E a Máscara de Pedra... se o que li for verdade, deixarei de ser humano. EU REJEITO MINHA HUMANIDADE, JOJO!\"",
      "Jonathan aperta o diário com força. Ele precisa impedir Dio a qualquer custo!",
    ],
  },
];

const DIO: Thing = {
  id: "dio",
  name: "Dio Brando",
  rect: r(2.7, 9.3, 0.75, 1.15),
  lines: ["Oque foi Jonathan? Perdeu algo aqui? Saia logo!"],
};
const DIO_ROUTE = [
  { x: 46, y: 184 },
  { x: 52, y: 190 },
  { x: 52, y: 232 },
  { x: 82, y: 232 },
  { x: 82, y: 259 },
];

const WALLS: Rect[] = [
  { x: 0, y: 0, w: W, h: 2 * T },
  { x: 0, y: 0, w: T, h: H },
  { x: W - T, y: 0, w: T, h: H },
  { x: 0, y: H - T, w: W, h: T },
];
const SOLIDS: Rect[] = [...WALLS, ...THINGS.map((t) => t.rect)];

const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ================== DESENHO ================== */
function px(c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawRoom(c: CanvasRenderingContext2D, t: number) {
  // piso de tábuas
  for (let y = 2 * T; y < H - T; y += 4) {
    const row = (y / 4) | 0;
    px(c, row % 2 ? "#3b2416" : "#442a1a", T, y, W - 2 * T, 4);
    for (let x = T + ((row * 23) % 28); x < W - T; x += 28) px(c, "#2a180e", x, y, 1, 4);
  }
  // parede de madeira escura
  px(c, "#24130c", 0, 0, W, 2 * T);
  for (let x = 0; x < W; x += 8) px(c, "#2f1a10", x, 2, 6, 2 * T - 8);
  px(c, "#6b4a1f", 0, 2 * T - 4, W, 2);
  px(c, "#120905", 0, 2 * T - 2, W, 2);
  // paredes laterais / inferior
  px(c, "#1a0e08", 0, 0, T, H);
  px(c, "#1a0e08", W - T, 0, T, H);
  px(c, "#1a0e08", 0, H - T, W, T);
  px(c, "#6b4a1f", T - 2, 2 * T, 2, H - 3 * T);
  px(c, "#6b4a1f", W - T, 2 * T, 2, H - 3 * T);
  // porta
  px(c, "#4a2a14", 5 * T - 2, H - T, T + 4, T);
  px(c, "#c9a24a", 5 * T + 10, H - 9, 2, 2);
  // tapete vermelho
  px(c, "#5a0f14", 2 * T, 4 * T, 7 * T, 9 * T);
  px(c, "#8e1b22", 2 * T + 3, 4 * T + 3, 7 * T - 6, 9 * T - 6);
  px(c, "#c9a24a", 2 * T + 5, 4 * T + 5, 7 * T - 10, 1);
  px(c, "#c9a24a", 2 * T + 5, 13 * T - 6, 7 * T - 10, 1);
  px(c, "#c9a24a", 2 * T + 5, 4 * T + 5, 1, 9 * T - 10);
  px(c, "#c9a24a", 9 * T - 6, 4 * T + 5, 1, 9 * T - 10);
  for (let y = 4 * T + 12; y < 13 * T - 10; y += 12)
    for (let x = 2 * T + 12; x < 9 * T - 10; x += 12) px(c, "#6d1219", x, y, 3, 3);

  // estantes
  const shelf = (x: number, y: number, w: number, h: number) => {
    px(c, "#2a160b", x, y, w, h);
    px(c, "#5a361b", x + 1, y + 1, w - 2, h - 2);
    const books = ["#7a1c1c", "#1f3d5c", "#2d5a2d", "#8a6a2a", "#4a2358", "#9a8a6a"];
    for (let sy = y + 3; sy < y + h - 4; sy += 7) {
      for (let bx = x + 3, i = 0; bx < x + w - 4; bx += 3, i++)
        px(c, books[(i * 7 + sy) % books.length]!, bx, sy, 2, 5);
      px(c, "#2a160b", x + 2, sy + 5, w - 4, 1);
    }
  };
  shelf(1 * T, 0.6 * T, 3 * T, 2 * T);
  shelf(7 * T, 0.6 * T, 3 * T, 2 * T);
  shelf(1 * T, 5 * T, T, 4 * T);

  // lareira
  const fx = 4 * T, fy = 0.4 * T;
  px(c, "#6d6660", fx - 2, fy, 3 * T + 4, 2.3 * T);
  px(c, "#a59c90", fx, fy + 2, 3 * T, 6);
  px(c, "#120905", fx + 10, fy + 12, 3 * T - 20, 2.3 * T - 14);
  const flick = Math.sin(t * 12) * 1.5;
  for (let i = 0; i < 5; i++) {
    const h = 8 + ((Math.sin(t * 9 + i * 1.7) + 1) * 4) | 0;
    px(c, "#d4431a", fx + 14 + i * 4, fy + 2.3 * T - 4 - h, 4, h);
    px(c, "#f5a623", fx + 15 + i * 4, fy + 2.3 * T - 4 - h * 0.6 + flick, 2, h * 0.6);
  }
  px(c, "#fff3b0", fx + 22, fy + 2.3 * T - 8, 4, 3);
  c.fillStyle = `rgba(255,140,40,${0.08 + Math.sin(t * 7) * 0.03})`;
  c.beginPath();
  c.arc(fx + 1.5 * T, 3 * T, 38, 0, Math.PI * 2);
  c.fill();

  // mesa
  const tb = THINGS[4]!.rect;
  px(c, "#1e0f07", tb.x, tb.y + 3, tb.w, tb.h);
  px(c, "#6a3a1a", tb.x, tb.y, tb.w, tb.h - 2);
  px(c, "#e8dcc0", tb.x + 4, tb.y + 4, tb.w - 8, tb.h - 12);
  for (const cx of [tb.x + 10, tb.x + tb.w - 12]) {
    px(c, "#c9a24a", cx, tb.y + 8, 3, 10);
    px(c, "#fff3b0", cx + 1, tb.y + 4 + Math.sin(t * 10 + cx) * 0.8, 1, 3);
  }
  px(c, "#f4f4f4", tb.x + 22, tb.y + 14, 4, 3);
  // cadeiras
  for (const cx of [tb.x + 6, tb.x + 21, tb.x + 36]) {
    px(c, "#3a1f0e", cx, tb.y - 6, 7, 5);
    px(c, "#3a1f0e", cx, tb.y + tb.h + 1, 7, 5);
  }

  // sofá
  const sf = THINGS[5]!.rect;
  px(c, "#3d0a10", sf.x, sf.y - 2, sf.w, sf.h + 4);
  px(c, "#7a1520", sf.x + 3, sf.y + 1, sf.w - 6, sf.h - 3);
  px(c, "#c9a24a", sf.x, sf.y + sf.h, sf.w, 1);

  // relógio
  const ck = THINGS[9]!.rect;
  px(c, "#1e0f07", ck.x + 1, ck.y - 6, ck.w - 2, ck.h + 6);
  px(c, "#5a3218", ck.x + 3, ck.y - 4, ck.w - 6, ck.h + 2);
  px(c, "#e8dcc0", ck.x + 4, ck.y - 2, 8, 8);
  px(c, "#120905", ck.x + 7, ck.y - 1, 1, 3);
  px(c, "#120905", ck.x + 8, ck.y + 2, 3, 1);
  px(c, "#c9a24a", ck.x + 7, ck.y + 10, 2, 12);
  px(c, "#c9a24a", ck.x + 5, ck.y + 20, 6, 4);

  // armadura
  const ar = THINGS[6]!.rect;
  px(c, "#5c6068", ar.x + 3, ar.y - 4, 10, 8);
  px(c, "#1a1a1a", ar.x + 5, ar.y - 1, 6, 1);
  px(c, "#8a8f98", ar.x + 2, ar.y + 4, 12, 12);
  px(c, "#5c6068", ar.x + 4, ar.y + 16, 3, 7);
  px(c, "#5c6068", ar.x + 9, ar.y + 16, 3, 7);

  // escrivaninha
  const dk = THINGS[7]!.rect;
  px(c, "#1e0f07", dk.x, dk.y + 2, dk.w, dk.h);
  px(c, "#5a3218", dk.x, dk.y, dk.w, dk.h - 2);
  px(c, "#e8dcc0", dk.x + 5, dk.y + 4, 8, 6);
  px(c, "#120905", dk.x + 18, dk.y + 3, 2, 8);
  px(c, "#c9a24a", dk.x + 8, dk.y + dk.h - 6, 16, 1);

  // piano
  const pn = THINGS[8]!.rect;
  px(c, "#050505", pn.x, pn.y, pn.w, pn.h);
  px(c, "#1c1c22", pn.x + 2, pn.y + 2, pn.w - 4, pn.h - 10);
  px(c, "#f0f0f0", pn.x + 2, pn.y + pn.h - 7, pn.w - 4, 5);
  for (let x = pn.x + 3; x < pn.x + pn.w - 3; x += 3) px(c, "#050505", x, pn.y + pn.h - 7, 1, 3);

  // plantas / vasos
  for (const [vx, vy] of [[1.2, 14.6], [9.2, 14.6], [1.2, 3.2], [9.2, 3.2]] as [number, number][]) {
    px(c, "#8a5a2a", vx * T + 3, vy * T + 6, 8, 6);
    px(c, "#2d5a2d", vx * T + 1, vy * T - 2, 12, 9);
    px(c, "#3f7a3f", vx * T + 4, vy * T, 5, 4);
  }
}

function drawJonathan(c: CanvasRenderingContext2D, x: number, y: number, dir: number, step: number) {
  // x,y = topo-esquerda de sprite 12x18
  const bob = step ? Math.round(Math.sin(step) * 1) : 0;
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.fillRect(x + 1, y + 16, 10, 3);
  const legA = step ? Math.round(Math.sin(step) * 2) : 0;
  px(c, "#1d2433", x + 3, y + 13 + Math.max(0, legA), 3, 4 - Math.max(0, legA));
  px(c, "#1d2433", x + 6, y + 13 + Math.max(0, -legA), 3, 4 - Math.max(0, -legA));
  px(c, "#2b3a5c", x + 1, y + 7 + bob, 10, 7); // casaco azul
  if (dir !== 1) px(c, "#f0ead8", dir === 2 ? x + 7 : dir === 3 ? x + 3 : x + 5, y + 7 + bob, 2, 5);
  px(c, "#e0b48a", x + 2, y + 1 + bob, 8, 7); // rosto
  if (dir === 0) {
    px(c, "#1a2a4a", x + 1, y - 1 + bob, 10, 3);
    px(c, "#1a2a4a", x + 1, y + 1 + bob, 2, 3);
    px(c, "#1a2a4a", x + 9, y + 1 + bob, 2, 3);
    px(c, "#111", x + 4, y + 4 + bob, 1, 2);
    px(c, "#111", x + 7, y + 4 + bob, 1, 2);
  } else if (dir === 1) {
    px(c, "#1a2a4a", x + 1, y - 1 + bob, 10, 9);
    px(c, "#304269", x + 2, y + 8 + bob, 8, 3);
  } else {
    const right = dir === 2;
    px(c, "#1a2a4a", x + 1, y - 1 + bob, 10, 3);
    px(c, "#1a2a4a", right ? x + 1 : x + 7, y + 1 + bob, 4, 6);
    px(c, "#111", right ? x + 8 : x + 3, y + 4 + bob, 1, 2);
    px(c, "#e0b48a", right ? x + 10 : x + 1, y + 5 + bob, 2, 2); // nariz no sentido do olhar
  }
}

function drawDio(c: CanvasRenderingContext2D, x: number, y: number, dir: number, step: number) {
  const bob = step ? Math.round(Math.sin(step)) : 0;
  px(c, "#160b13", x + 1, y + 16, 11, 2);
  px(c, "#28182f", x + 3, y + 13, 3, 4);
  px(c, "#28182f", x + 8, y + 13, 3, 4);
  px(c, "#4f245d", x + 1, y + 7 + bob, 12, 7);
  px(c, "#b98b36", x + 5, y + 8 + bob, 4, 4);
  px(c, "#ecc49a", x + 3, y + 2 + bob, 8, 6);
  px(c, "#d8a438", x + 2, y - 1 + bob, 9, 4);
  px(c, "#f6d46b", x + 7, y + bob, 4, 3);
  if (dir === 0) {
    px(c, "#251521", x + 5, y + 5 + bob, 1, 1);
    px(c, "#251521", x + 9, y + 5 + bob, 1, 1);
  } else {
    px(c, "#d8a438", x + 2, y + 2 + bob, 5, 5);
  }
}

/* ================== BGM ================== */
function startBgm(): () => void {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC();
  void ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  // drone grave
  const drone = ctx.createOscillator();
  const dg = ctx.createGain();
  drone.type = "sawtooth";
  drone.frequency.value = 55;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  dg.gain.value = 0.35;
  drone.connect(lp).connect(dg).connect(master);
  drone.start();
  // arpejo sombrio (lá menor harmônico)
  const seq = [220, 261.6, 329.6, 311.1, 220, 261.6, 349.2, 329.6, 207.7, 246.9, 329.6, 293.7];
  let i = 0;
  const beat = 0.42;
  let next = ctx.currentTime + 0.1;
  const tick = () => {
    while (next < ctx.currentTime + 0.5) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = seq[i % seq.length]!;
      g.gain.setValueAtTime(0.0001, next);
      g.gain.exponentialRampToValueAtTime(0.5, next + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, next + beat * 1.8);
      o.connect(g).connect(master);
      o.start(next);
      o.stop(next + beat * 2);
      if (i % 12 === 0) {
        const b = ctx.createOscillator();
        const bg = ctx.createGain();
        b.type = "sine";
        b.frequency.value = 41.2;
        bg.gain.setValueAtTime(0.9, next);
        bg.gain.exponentialRampToValueAtTime(0.0001, next + 2);
        b.connect(bg).connect(master);
        b.start(next);
        b.stop(next + 2.1);
      }
      i++;
      next += beat;
    }
  };
  const id = window.setInterval(tick, 100);
  return () => {
    window.clearInterval(id);
    void ctx.close();
  };
}

function blip() {
  try {
    const AC = window.AudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.1);
    setTimeout(() => void ctx.close(), 200);
  } catch {
    /* sem áudio */
  }
}

/* ================== COMPONENTE ================== */
export function PhantomBloodMap({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ x: 0, y: 0 });
  const keys = useRef<{ [k: string]: boolean | undefined }>({});
  const player = useRef({ x: 5 * T + 2, y: 14 * T, dir: 1, step: 0 });
  const dio = useRef({ x: DIO.rect.x, y: DIO.rect.y, dir: 0, step: 0, route: -1, gone: false });
  const nearRef = useRef<Thing | null>(null);
  const dialogRef = useRef(false);
  const [near, setNear] = useState<Thing | null>(null);
  const [dialog, setDialog] = useState<{ thing: Thing; page: number } | null>(null);
  const [found, setFound] = useState(false);
  const [solved, setSolved] = useState(false);
  const [muted, setMuted] = useState(false);
  const [portraitVisible, setPortraitVisible] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  dialogRef.current = !!dialog;

  // BGM
  useEffect(() => {
    if (muted) return;
    return startBgm();
  }, [muted]);

  // loop
  useEffect(() => {
    const cv = canvasRef.current;
    const c = cv?.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = player.current;
      let ix = input.current.x;
      let iy = input.current.y;
      const k = keys.current;
      if (k["ArrowLeft"] || k["a"]) ix = -1;
      if (k["ArrowRight"] || k["d"]) ix = 1;
      if (k["ArrowUp"] || k["w"]) iy = -1;
      if (k["ArrowDown"] || k["s"]) iy = 1;
      if (dialogRef.current) ix = iy = 0;
      const mag = Math.hypot(ix, iy);
      if (mag > 0.15) {
        const sp = 60 * Math.min(1, mag);
        const vx = (ix / mag) * sp * dt;
        const vy = (iy / mag) * sp * dt;
        const box = (x: number, y: number): Rect => ({ x: x + 1, y: y + 12, w: 10, h: 6 });
        const blocks = (b: Rect) => SOLIDS.some((s) => hit(b, s)) || (!dio.current.gone && dio.current.route < 0 && hit(b, { x: dio.current.x, y: dio.current.y, w: 12, h: 18 }));
        if (!blocks(box(p.x + vx, p.y))) p.x += vx;
        if (!blocks(box(p.x, p.y + vy))) p.y += vy;
        p.dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 2 : 3) : iy > 0 ? 0 : 1;
        p.step += dt * 14;
      } else p.step = 0;

      // proximidade
      const npc = dio.current;
      if (npc.route >= 0 && !npc.gone) {
        const target = DIO_ROUTE[npc.route];
        if (target) {
          const dx = target.x - npc.x;
          const dy = target.y - npc.y;
          const distance = Math.hypot(dx, dy);
          const move = Math.min(distance, 40 * dt);
          if (distance > 0) {
            npc.x += (dx / distance) * move;
            npc.y += (dy / distance) * move;
            npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : dy > 0 ? 0 : 1;
            npc.step += dt * 12;
          }
          if (distance <= move + 0.1) npc.route++;
        } else npc.gone = true;
      }

      const zone: Rect = { x: p.x - 6, y: p.y + 4, w: 24, h: 22 };
      let best: Thing | null = null;
      if (!npc.gone && npc.route < 0 && hit(zone, { x: npc.x, y: npc.y, w: 12, h: 18 })) best = DIO;
      if (!best) for (const th of THINGS) if (hit(zone, th.rect)) { best = th; break; }
      if (best !== nearRef.current) {
        nearRef.current = best;
        setNear(best);
      }

      drawRoom(c, now / 1000);
      if (best) {
        const b = best.id === "dio" ? { x: npc.x, y: npc.y, w: 12, h: 18 } : best.rect;
        c.strokeStyle = `rgba(255,215,90,${0.5 + Math.sin(now / 150) * 0.4})`;
        c.lineWidth = 1;
        c.strokeRect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3);
      }
      if (!npc.gone) drawDio(c, npc.x, npc.y, npc.dir, npc.step);
      drawJonathan(c, p.x, p.y, p.dir, p.step);
      // vinheta
      const g = c.createRadialGradient(p.x + 6, p.y + 8, 30, p.x + 6, p.y + 8, 190);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(10,0,20,0.6)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const kd = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.key === " " || e.key === "Enter" || e.key === "e") interactRef.current();
    };
    const ku = (e: KeyboardEvent) => (keys.current[e.key] = false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  const interact = useCallback(() => {
    if (solved) return;
    if (dialog) {
      blip();
      if (dialog.page < dialog.thing.lines.length - 1) setDialog({ ...dialog, page: dialog.page + 1 });
      else {
        if (dialog.thing.diary) setSolved(true);
        if (dialog.thing.id === "dio") {
          setPortraitVisible(false);
          dio.current.route = 0;
        }
        setDialog(null);
      }
      return;
    }
    if (!nearRef.current) return;
    blip();
    if (nearRef.current.diary) setFound(true);
    if (nearRef.current.id === "dio") setPortraitVisible(true);
    setDialog({ thing: nearRef.current, page: 0 });
  }, [dialog, solved]);
  const interactRef = useRef(interact);
  interactRef.current = interact;

  useEffect(() => {
    if (solved) {
      try {
        const cur = Number(localStorage.getItem("jojo-unlocked") || "1");
        if (cur < 2) localStorage.setItem("jojo-unlocked", "2");
      } catch { /* */ }
    }
  }, [solved]);

  // joystick
  const onStick = (e: React.PointerEvent) => {
    const b = baseRef.current?.getBoundingClientRect();
    if (!b) return;
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

  return (
    <section className="pb-game jojo-fade-in relative z-20 flex h-[100dvh] flex-col items-center">
      <header className="pb-hud">
        <button className="pb-icon" onClick={onExit} aria-label="Voltar ao menu">✕</button>
        <div className="pb-objective">
          <span className="pb-part">PARTE 1 · PHANTOM BLOOD</span>
          <span className={found ? "pb-done" : ""}>
            {found ? "✔ " : "◆ "}Achar o diário escondido de Dio Brando
          </span>
        </div>
        <button className="pb-icon" onClick={() => setMuted((m) => !m)} aria-label="Música">
          {muted ? "♪̸" : "♪"}
        </button>
      </header>

      <div className="pb-stage">
        <canvas ref={canvasRef} width={W} height={H} className="pb-canvas" />
        <img src={dioPortrait} alt="Retrato de Dio Brando" width={768} height={1024} className={`pb-dio-portrait ${portraitVisible ? "pb-dio-portrait-visible" : ""}`} aria-hidden={!portraitVisible} />
        {dialog && (
          <button className={`pb-dialog ${dialog.thing.id === "dio" ? "pb-dialog-dio" : ""}`} onClick={interact}>
            <span className="pb-dialog-name">{dialog.thing.name}</span>
            <span className="pb-dialog-text">{dialog.thing.lines[dialog.page]}</span>
            <span className="pb-dialog-next">▼</span>
          </button>
        )}
        {solved && (
          <div className="pb-solved jojo-fade-in">
            <p className="pb-solved-title">MISTÉRIO RESOLVIDO!</p>
            <p className="pb-solved-sub">Os planos de Dio foram revelados.<br />PARTE 2: Battle Tendency desbloqueada.</p>
            <p className="pb-tbc">TO BE CONTINUED ⟶</p>
            <button className="jojo-btn" onClick={onExit}>VOLTAR AO MENU</button>
          </div>
        )}
      </div>

      <div className="pb-controls">
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
        <button
          className={`pb-interact ${near && !dialog ? "pb-interact-on" : ""}`}
          onClick={interact}
          disabled={(!near && !dialog) || solved}
        >
          {dialog ? "AVANÇAR" : near?.id === "dio" ? "CONVERSAR" : "INTERAGIR"}
          {near && !dialog && <small>{near.name}</small>}
        </button>
      </div>
    </section>
  );
}
