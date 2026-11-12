"use client";

// Two load effects for the hero.
// Scramble is the library's `scramble` move in React: letters show random glyphs at half strength, then lock into the
// real text from left to right; every letter keeps its own width, so nothing reflows. CountUp runs a number up from 0.
// Both render the finished text for people who asked for less motion, and expose it whole to screen readers.
import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>";
const hash = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

/** t in seconds since mount (after `delay`), or Infinity once done / when motion is reduced; null before mount. */
function useRun(delay: number, duration: number) {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const s = (now - t0) / 1000 - delay;
      if (still || s >= duration + 0.15) { setT(Infinity); return; }
      setT(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delay, duration]);
  return t;
}

export function Scramble({ text, delay = 0, duration = 1.2, seed = 1 }: { text: string; delay?: number; duration?: number; seed?: number }) {
  const t = useRun(delay, duration);
  const words = text.split(" ");
  const n = text.replace(/ /g, "").length;
  const tick = t === null || t === Infinity ? 0 : Math.floor((t * 30) / 2);
  let i = 0;
  return (
    <span aria-label={text} role="text">
      {words.map((w, k) => (
        <span key={k} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c, j) => {
              const idx = i++;
              const appear = (idx / n) * duration * 0.35;
              const settle = duration * (0.3 + 0.7 * (idx / n)) + hash(seed, idx) * 0.1;
              const done = t === Infinity || (t !== null && t >= settle);
              const hidden = t === null || (!done && t < appear);
              return (
                <span key={j} className="relative inline-block">
                  <span style={{ opacity: done ? 1 : 0 }}>{c}</span>
                  {done || hidden ? null : <span className="absolute inset-0 text-center opacity-50">{GLYPHS[Math.floor(hash(tick + seed, idx) * GLYPHS.length)]}</span>}
                </span>
              );
            })}
          </span>
          {k < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export function CountUp({ to, delay = 0, duration = 1.3 }: { to: number; delay?: number; duration?: number }) {
  const t = useRun(delay, duration);
  const p = t === null ? 0 : t === Infinity ? 1 : Math.min(1, Math.max(0, t / duration));
  const v = Math.round(to * (1 - Math.pow(1 - p, 3)));
  return (
    <span aria-label={String(to)} role="text" className="relative inline-block tabular-nums">
      <span className="invisible" aria-hidden>{to}</span>
      <span className="absolute inset-0" aria-hidden style={{ opacity: t === null ? 0 : 1 }}>{v}</span>
    </span>
  );
}
