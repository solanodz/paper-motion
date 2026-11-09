"use client";

import { useEffect, useRef, useState } from "react";
import type { Beat } from "./beats-strip";
import type { Theme } from "@/lib/theme";

/**
 * The script, played: a clock runs through the beats and each one arrives as a schematic slide (its name small,
 * what happens as the line) in the look's colors and type. Not the engine's render: a sketch of the rhythm, so a
 * recipe, a combination and a structure the agent proposes can be compared before anything is built.
 * Click to pause and resume; drag the bar to scrub.
 */
export function ScriptPlayer({ beats, duration, theme, title, compact = false, autoplay = true }: { beats: Beat[]; duration?: number; theme?: Theme; title?: string; compact?: boolean; autoplay?: boolean }) {
  const total = duration ?? Math.max(...beats.map((b) => b.to));
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => { const dt = (now - last) / 1000; last = now; setT((x) => (x + dt) % total); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, visible, total]);

  const c = theme?.palette ?? { ground: "#000000", figure: "#ffffff", muted: "#8a8a8a", surface: "#0a0a0a", accent: "#e9e4d8" };
  const display = theme?.vars["--pm-display"] ?? "var(--font-geist-serif), Georgia, serif";
  const mono = theme?.vars["--pm-mono"] ?? "var(--font-geist-mono), ui-monospace, monospace";
  // the beats live now (overlapping ones stack: the first is the slide, the rest are small cues)
  const live = beats.filter((b) => t >= b.from && t < b.to);
  const main = live[0] ?? beats[beats.length - 1];
  const idx = beats.indexOf(main);
  const p = main ? Math.min(1, Math.max(0, (t - main.from) / Math.max(0.001, main.to - main.from))) : 0;
  const enter = Math.min(1, p / 0.18), exit = main.to >= total - 0.05 ? 0 : Math.max(0, (p - 0.82) / 0.18);
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const rise = (1 - ease(enter)) * 18 + ease(exit) * -10, alpha = ease(enter) * (1 - ease(exit));
  const scrub = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); setT(Math.min(total - 0.01, Math.max(0, ((e.clientX - r.left) / r.width) * total))); };

  return (
    <div ref={box} className="relative h-full w-full select-none overflow-hidden" style={{ background: c.ground, color: c.figure, containerType: "inline-size" }} onClick={() => setPlaying((x) => !x)}>
      {/* a quiet field, so the sketch is not a black card */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at ${30 + idx * 15}% 60%, ${c.accent}22 0%, transparent 55%)` }} />
      {/* top right, so a board's option letter (top left) never collides with it */}
      <div className="absolute right-[6%] top-[9%] flex items-center gap-2" style={{ fontFamily: mono, fontSize: compact ? "max(9px, 2.6cqw)" : "max(10px, 1.6cqw)", color: c.muted }}>
        <span>{title ?? "script"}</span><span style={{ opacity: 0.5 }}>·</span><span>{idx + 1} / {beats.length}</span>
      </div>
      {main ? (
        <div className="absolute left-[6%] right-[6%] top-[30%]" style={{ opacity: alpha, transform: `translateY(${rise}px)` }}>
          <div style={{ fontFamily: mono, fontSize: compact ? "max(9px, 2.6cqw)" : "max(10px, 1.6cqw)", color: c.accent, letterSpacing: "0.04em" }}>{main.name}</div>
          <div className="mt-[2%]" style={{ fontFamily: display, fontSize: compact ? "max(14px, 6.5cqw)" : "max(18px, 4.2cqw)", lineHeight: 1.02, letterSpacing: "-0.02em", maxWidth: "20ch" }}>{main.what}</div>
          {live.slice(1).map((b) => <div key={b.name + b.from} className="mt-[3%]" style={{ fontFamily: mono, fontSize: compact ? "max(8px, 2.3cqw)" : "max(10px, 1.4cqw)", color: c.muted }}>+ {b.name} · {b.what}</div>)}
        </div>
      ) : null}
      {/* the bar: beats as segments, the clock as a line; drag to scrub */}
      <div className="absolute bottom-[9%] left-[6%] right-[6%]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-5 cursor-ew-resize" onPointerDown={(e) => { setPlaying(false); scrub(e); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (e.buttons) scrub(e); }}>
          {beats.map((b) => <div key={b.name + b.from} className="absolute top-[8px] h-[3px] rounded-full" style={{ left: `${(b.from / total) * 100}%`, width: `calc(${((b.to - b.from) / total) * 100}% - 2px)`, background: b === main ? c.figure : `${c.figure}44` }} />)}
          <div className="absolute top-[3px] h-[13px] w-px" style={{ left: `${(t / total) * 100}%`, background: c.accent }} />
        </div>
        <div className="flex justify-between" style={{ fontFamily: mono, fontSize: compact ? "max(8px, 2.2cqw)" : "max(10px, 1.3cqw)", color: c.muted }}>
          <span>{playing ? "" : "paused · click to play"}</span><span>{t.toFixed(1)} / {total} s</span>
        </div>
      </div>
    </div>
  );
}
