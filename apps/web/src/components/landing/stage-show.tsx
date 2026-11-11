"use client";

import { useEffect, useRef, useState } from "react";

type Stage = { t: string; d: string };
const EVERY = 4200;

/**
 * The six stages of a piece, as the studio shows them: a strip of cells with the open one in paper. It walks through
 * them on its own while on screen; pointing at a stage takes over. Under the strip, what that stage looks like.
 */
export function StageShow({ stages, visuals }: { stages: Stage[]; visuals: React.ReactNode[] }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % stages.length), EVERY);
    return () => clearInterval(id);
  }, [auto, seen, stages.length]);
  const s = stages[i];
  return (
    <div ref={box}>
      <ol className="grid grid-cols-3 border-y border-line lg:grid-cols-6">
        {stages.map((x, n) => {
          const on = n === i;
          return (
            <li key={x.t} className="border-line max-lg:[&:nth-child(-n+3)]:border-b [&:not(:last-child)]:border-r max-lg:[&:nth-child(3)]:border-r-0">
              <button type="button" aria-pressed={on} onClick={() => { setI(n); setAuto(false); }} className={`relative flex h-full min-h-[92px] w-full flex-col items-start justify-between px-4 pb-3 pt-3 text-left md:min-h-[112px] md:px-5 ${on ? "bg-paper text-ground" : "hover:bg-raised"}`}>
                <span className={`num text-[22px] md:text-[26px] ${on ? "!text-ground/45" : ""}`}>0{n + 1}</span>
                <span className="text-[14px] font-medium md:text-[16px]">{x.t}</span>
                {on && auto && seen ? <span key={i} className="stage-progress absolute bottom-0 left-0 h-[3px] bg-ground" style={{ animationDuration: `${EVERY}ms` }} /> : null}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col justify-between gap-10 border-line px-5 py-8 md:px-8 md:py-10 lg:border-r">
          <div>
            <h3 className="font-serif text-[44px] leading-none tracking-[-0.025em] md:text-[64px]">{s.t}</h3>
            <p className="mt-5 max-w-[36ch] text-[16px] leading-relaxed text-muted md:text-[17px]">{s.d}</p>
          </div>
          <p className="font-mono text-[12px] text-muted">npx paper-motion piece review my-video {s.t.toLowerCase()}</p>
        </div>
        <div className="aspect-video overflow-hidden bg-surface max-lg:border-t max-lg:border-line" key={i}>{visuals[i]}</div>
      </div>
    </div>
  );
}
