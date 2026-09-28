import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JOJO'S BIZARRE ADVENTURE: THE CHRONICLES" },
      {
        name: "description",
        content:
          "RPG 2D de mistério e Destino: escolha sua Parte, desperte seu Stand e enfrente o inevitável.",
      },
      { property: "og:title", content: "JOJO'S BIZARRE ADVENTURE: THE CHRONICLES" },
      {
        property: "og:description",
        content: "RPG 2D de mistério e Destino — desperte seu Stand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MainMenu,
});

type Phase = "menu" | "fading" | "loading" | "parts" | "intro";

type JojoPart = {
  id: number;
  title: string;
  protagonist: string;
  unlocked: boolean;
};

const PARTS: JojoPart[] = [
  { id: 1, title: "Phantom Blood", protagonist: "Jonathan Joestar", unlocked: true },
  { id: 2, title: "Battle Tendency", protagonist: "Joseph Joestar", unlocked: false },
  { id: 3, title: "Stardust Crusaders", protagonist: "Jotaro Kujo", unlocked: false },
  { id: 4, title: "Diamond is Unbreakable", protagonist: "Josuke Higashikata", unlocked: false },
  { id: 5, title: "Golden Wind", protagonist: "Giorno Giovanna", unlocked: false },
  { id: 6, title: "Stone Ocean", protagonist: "Jolyne Cujoh", unlocked: false },
];

const GLYPHS = ["ゴ", "ゴ", "ゴ", "ド", "ォ", "メ", "MENACING", "ゴ", "ド"];

/** Deterministic pseudo-random so SSR and client render identical floats. */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return Number((x - Math.floor(x)).toFixed(3));
}

function playClick() {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(760, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => void ctx.close();
  } catch {
    /* som é opcional */
  }
}

function MainMenu() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<number | null>(null);
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    };
  }, []);

  const floats = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const glyph = GLYPHS[i % GLYPHS.length];
        const long = glyph === "MENACING";
        return {
          glyph,
          left: rand(i + 1) * 90 + 3,
          size: long ? rand(i + 40) * 0.5 + 0.8 : rand(i + 40) * 1.8 + 1.3,
          dur: rand(i + 80) * 11 + 13,
          delay: -rand(i + 120) * 20,
          drift: (rand(i + 160) - 0.5) * 10,
          peak: rand(i + 200) * 0.16 + 0.12,
          gold: rand(i + 240) > 0.45,
        };
      }),
    [],
  );

  const showHint = (text: string) => {
    playClick();
    setHint(text);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2600);
  };

  const startNewGame = () => {
    playClick();
    setHint(null);
    setPhase("fading");
    fadeTimer.current = window.setTimeout(() => setPhase("loading"), 850);
  };

  const openParts = () => {
    playClick();
    setHint(null);
    setPhase("parts");
  };

  const openIntro = () => {
    playClick();
    setPhase("intro");
  };

  const backToMenu = () => {
    playClick();
    setPhase("menu");
  };

  const lockedHint = (id: number) =>
    showHint(`A PARTE ${id} está selada. Resolva o mistério da Parte ${id - 1} para libertá-la.`);

  return (
    <main className="jojo-scene relative min-h-screen overflow-hidden">
      {/* Onomatopeias flutuantes (Gogogo / Menacing) */}
      <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
        {floats.map((f, i) => (
          <span
            key={i}
            className={`jojo-float ${f.gold ? "jojo-float-gold" : "jojo-float-aura"}`}
            style={
              {
                left: `${f.left}%`,
                fontSize: `${f.size}rem`,
                "--dur": `${f.dur}s`,
                "--delay": `${f.delay}s`,
                "--drift": `${f.drift}vw`,
                "--peak": `${f.peak}`,
              } as CSSProperties
            }
          >
            {f.glyph}
          </span>
        ))}
      </div>
      <div className="jojo-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      {phase === "loading" ? (
        <section className="jojo-loading jojo-fade-in relative z-20 flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <span className="jojo-loading-star" aria-hidden="true">
            ゴ
          </span>
          <p className="jojo-loading-text">
            Carregando Novo Universo
            <span className="jojo-dots" aria-hidden="true" />
          </p>
          <div className="jojo-loading-bar" role="presentation">
            <div className="jojo-loading-fill" />
          </div>
          <p className="jojo-loading-echo" aria-hidden="true">
            ゴ ゴ ゴ ゴ
          </p>
        </section>
      ) : phase === "parts" ? (
        <section className="jojo-fade-in relative z-10 flex min-h-screen flex-col items-center gap-6 px-4 py-10 sm:px-6">
          <header className="jojo-rise text-center">
            <p className="jojo-eyebrow">◆ Escolha o seu Destino ◆</p>
            <h2 className="jojo-parts-title mt-3">Selecionar Parte</h2>
            <p className="jojo-parts-sub">
              As Partes despertam em sequência — resolva um mistério para libertar o próximo.
            </p>
          </header>

          <div className="jojo-rise grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2" style={{ animationDelay: "0.15s" }}>
            {PARTS.map((part) =>
              part.unlocked ? (
                <button key={part.id} type="button" className="jojo-part" onClick={openIntro}>
                  <span className="jojo-part-num">Parte {part.id}</span>
                  <span className="jojo-part-name">{part.title}</span>
                  <span className="jojo-part-hero">
                    <span className="jojo-part-label">Protagonista</span>
                    {part.protagonist}
                  </span>
                  <span className="jojo-part-cta">Iniciar a história ▸</span>
                </button>
              ) : (
                <button
                  key={part.id}
                  type="button"
                  className="jojo-part jojo-part-locked"
                  onClick={() => lockedHint(part.id)}
                  aria-disabled="true"
                >
                  <span className="jojo-part-lock" aria-hidden="true">
                    🔒
                  </span>
                  <span className="jojo-part-num">Parte {part.id}</span>
                  <span className="jojo-part-name">{part.title}</span>
                  <span className="jojo-part-hero">
                    <span className="jojo-part-label">Protagonista</span>
                    {part.protagonist}
                  </span>
                  <span className="jojo-part-sealed">Selada pelo Destino</span>
                </button>
              ),
            )}
          </div>

          <p className={`jojo-hint ${hint ? "jojo-hint-show" : ""}`} aria-live="polite">
            {hint ?? ""}
          </p>

          <button type="button" className="jojo-btn jojo-btn-back" onClick={backToMenu}>
            ◂ Voltar ao Menu
          </button>
        </section>
      ) : phase === "intro" ? (
        <section className="jojo-fade-in relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <p className="jojo-eyebrow">◆ Parte 1 — Phantom Blood ◆</p>
          <h2 className="jojo-intro-title">Jonathan Joestar</h2>
          <div className="jojo-intro-card jojo-rise">
            <p>
              Inglaterra, 1880. O jovem <strong>Jonathan Joestar</strong>, herdeiro da nobre família
              Joestar, vê sua vida virar de cabeça para baixo com a chegada do ambicioso{" "}
              <strong>Dio Brando</strong>, adotado por seu pai.
            </p>
            <p>
              Quando uma misteriosa <strong>Máscara de Pedra</strong> revela um poder sombrio e Dio
              abandona sua humanidade, Jonathan precisa dominar a energia vital <strong>Hamon</strong>{" "}
              para enfrentar o mal que ameaça tudo o que ama.
            </p>
            <p className="jojo-intro-quote">「 O Destino dos Joestar começa aqui. 」</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button type="button" className="jojo-btn jojo-btn-primary" onClick={startNewGame}>
              Começar a Aventura
            </button>
            <button type="button" className="jojo-btn jojo-btn-back" onClick={openParts}>
              ◂ Voltar às Partes
            </button>
          </div>
        </section>
      ) : (
        <section
          className={`relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 ${
            phase === "fading" ? "jojo-fade-out" : ""
          }`}
        >
          <header className="jojo-rise text-center" style={{ animationDelay: "0.05s" }}>
            <p className="jojo-eyebrow">◆ Um RPG de Destino Bizarro ◆</p>
            <h1 className="jojo-title mt-4">
              <span className="jojo-title-line">
                <span className="jojo-title-outline" aria-hidden="true">
                  JOJO'S BIZARRE
                </span>
                <span className="jojo-title-fill">JOJO'S BIZARRE</span>
              </span>
              <span className="jojo-title-line jojo-title-line-xl">
                <span className="jojo-title-outline" aria-hidden="true">
                  ADVENTURE
                </span>
                <span className="jojo-title-fill">ADVENTURE</span>
              </span>
            </h1>
            <div className="jojo-subtitle">
              <span>THE CHRONICLES</span>
            </div>
          </header>

          <nav
            className="jojo-rise mt-6 flex w-full max-w-xs flex-col gap-4 sm:max-w-sm"
            style={{ animationDelay: "0.35s" }}
          >
            <button type="button" className="jojo-btn jojo-btn-primary" onClick={startNewGame}>
              Novo Jogo
            </button>
            <button type="button" className="jojo-btn" onClick={openParts}>
              Selecionar Parte
            </button>
            <button
              type="button"
              className="jojo-btn"
              onClick={() => showHint("Créditos & Opções chegam na próxima tela.")}
            >
              Créditos & Opções
            </button>
          </nav>

          <p className={`jojo-hint ${hint ? "jojo-hint-show" : ""}`} aria-live="polite">
            {hint ?? ""}
          </p>

          <footer
            className="jojo-rise absolute bottom-4 text-[0.6rem] uppercase tracking-[0.3em] text-gold-deep"
            style={{ animationDelay: "0.5s" }}
          >
            Fan Project — Sem fins lucrativos
          </footer>
        </section>
      )}
    </main>
  );
}
