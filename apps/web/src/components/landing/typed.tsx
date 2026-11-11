"use client";

import { useEffect, useState } from "react";

/**
 * A line that types itself once, the block caret running ahead and left blinking at the end: the library's type-on.
 * The full text holds the space from the first paint (and is what a screen reader gets), so nothing jumps; people
 * who asked for less motion just see it written.
 */
export function Typed({ text, delay = 0, step = 14 }: { text: string; delay?: number; step?: number }) {
  const [n, setN] = useState<number | null>(null);   // null: not typing, show it all
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.max(0, Math.floor((now - t0 - delay) / step));
      setN(Math.min(text.length, k));
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, step]);
  return (
    <span className="relative block">
      <span className={n === null ? "" : "invisible"}>{text}</span>
      {n === null ? null : (
        <span aria-hidden className="absolute inset-0">
          {text.slice(0, n)}
          <i className={`ml-[0.1em] inline-block h-[1.1em] w-[0.6em] bg-paper align-text-bottom ${n >= text.length ? "caret-blink" : ""}`} />
        </span>
      )}
    </span>
  );
}
