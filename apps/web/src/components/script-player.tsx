"use client";

import { useEffect, useRef, useState } from "react";
import type { Beat } from "./beats-strip";
import type { Theme } from "@/lib/theme";

/**
 * The script, played: a clock runs through the beats and each one arrives as a schematic slide (its name small,
 * what happens as the line) in the look's colors and type. Not the engine's render: a sketch of the rhythm, so a
 * recipe, a combination and a structure the agent proposes can be compared before anything is built.
 * Flat and ruled like the rest of the system: a head line, the slide over the beat's numeral, and the beats as a
 * strip of flush segments. Click to pause and resume; drag the strip to scrub.
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
  const small = { fontFamily: mono, fontSize: compact ? "max(9px, 2.6cqw)" : "max(10px, 1.6cqw)" };
  const two = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={box} className="relative h-full w-full select-none overflow-hidden" style={{ background: c.ground, color: c.figure, containerType: "inline-size" }} onClick={() => setPlaying((x) => !x)}>
      {/* the beat's numeral, flat in the look's surface color, so the sketch is not an empty card */}
      <div aria-hidden className="absolute bottom-[24%] right-[5%] leading-[0.8]" style={{ fontFamily: mono, fontSize: "34cqw", fontWeight: 500, letterSpacing: "-0.06em", color: c.surface }}>{two(idx + 1)}</div>
      {/* the head line: what plays, and which beat of how many */}
      <div className="absolute left-[6%] right-[6%] top-[8%] flex items-baseline justify-between gap-3" style={{ ...small, color: c.muted }}>
        <span className="min-w-0 truncate">{title ?? "script"}</span><span className="shrink-0">{two(idx + 1)} / {two(beats.length)}</span>
      </div>
      {main ? (
        <div className="absolute left-[6%] right-[6%] top-[28%]" style={{ opacity: alpha, transform: `translateY(${rise}px)` }}>
          <div style={{ ...small, color: c.accent, letterSpacing: "0.04em" }}>{main.name}</div>
          <div className="mt-[2%]" style={{ fontFamily: display, fontSize: compact ? "max(14px, 6.5cqw)" : "max(18px, 4.2cqw)", lineHeight: 1.02, letterSpacing: "-0.02em", maxWidth: "20ch" }}>{main.what}</div>
          {live.slice(1).map((b) => <div key={b.name + b.from} className="mt-[3%] flex gap-[1.5%]" style={{ fontFamily: mono, fontSize: compact ? "max(8px, 2.3cqw)" : "max(10px, 1.4cqw)", color: c.muted }}><span className="shrink-0" style={{ color: c.figure }}>+ {b.name}</span><span className="min-w-0 truncate">{b.what}</span></div>)}
        </div>
      ) : null}
      {/* the strip: beats as flush segments, the clock as a line; drag to scrub */}
      <div className="absolute bottom-[8%] left-[6%] right-[6%]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-5 cursor-ew-resize" onPointerDown={(e) => { setPlaying(false); scrub(e); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (e.buttons) scrub(e); }}>
          {beats.map((b) => <div key={b.name + b.from} className="absolute top-[8px] h-1" style={{ left: `${(b.from / total) * 100}%`, width: `calc(${((b.to - b.from) / total) * 100}% - 1px)`, background: b === main ? c.figure : `${c.figure}44` }} />)}
          <div className="absolute top-[2px] h-4 w-px" style={{ left: `${(t / total) * 100}%`, background: c.accent }} />
        </div>
        <div className="flex justify-between gap-3" style={{ fontFamily: mono, fontSize: compact ? "max(8px, 2.2cqw)" : "max(10px, 1.3cqw)", color: c.muted }}>
          <span>{playing ? "" : "Paused. Click to play."}</span><span className="shrink-0">{t.toFixed(1)} / {total} s</span>
        </div>
      </div>
    </div>
  );
}
