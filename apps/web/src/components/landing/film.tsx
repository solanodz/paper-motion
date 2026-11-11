"use client";

// The film on the landing's monitor is a real one. Six blocks from the library, in paper-motion's own brand on the
// neuro-slate background, rendered by the engine with `chain` and joined by whips. Nothing is drawn here: these are the
// clips (public/landing-film), encoded from examples/paper-motion-brand/pieces/landing-film, so what you watch is
// exactly what the library gives you. Re-render there with `pamo chain landing-film --motion-blur 5` and `--drafts`.
import { useEffect, useRef, useState } from "react";
import { AutoVideo } from "@/components/landing/auto-video";

export const SCENES = [
  { id: "marker-highlight", beat: "The hook", d: 4.8 },
  { id: "terminal-run", beat: "The agent", d: 6.2 },
  { id: "browser-frame", beat: "The library", d: 6.4 },
  { id: "toast-stack", beat: "Your approvals", d: 4 },
  { id: "stat-row", beat: "The numbers", d: 5.6 },
  { id: "text-mask", beat: "Liquid metal", d: 5.6 },
] as const;
const TOTAL = SCENES.reduce((a, s) => a + s.d, 0);
const BASE = "/landing-film";

/** One part, alone: its draft looping, or its still. */
export function Part({ k, poster = false }: { k: number; poster?: boolean }) {
  const src = `${BASE}/part-${k + 1}`;
  // eslint-disable-next-line @next/next/no-img-element
  return poster ? <img src={`${src}.jpg`} alt="" className="h-full w-full object-cover" /> : <AutoVideo src={`${src}.webm`} poster={`${src}.jpg`} />;
}

/** The joined film. `timeline` adds the five beats under the frame, with a playhead that follows the video. */
export function Film({ timeline = false }: { timeline?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!timeline) return;
    let raf = 0;
    const tick = () => {
      const v = box.current?.querySelector("video");
      if (v && v.duration) setP(v.currentTime / v.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeline]);
  const video = <AutoVideo src={`${BASE}/film.webm`} poster={`${BASE}/film.jpg`} />;
  if (!timeline) return video;
  const starts = SCENES.map((_, i) => SCENES.slice(0, i).reduce((x, y) => x + y.d, 0));
  return (
    <div ref={box}>
      <div className="aspect-video overflow-hidden bg-black">{video}</div>
      <div className="relative mt-[1.2cqi] flex gap-[2px]">
        {SCENES.map((s, i) => {
          const from = starts[i] / TOTAL, to = (starts[i] + s.d) / TOTAL;
          const fill = Math.min(1, Math.max(0, (p - from) / (to - from)));
          const on = p >= from && p < to;
          return (
            <div key={s.id} className="min-w-0" style={{ flex: s.d }}>
              <i className="block h-[max(3px,0.4cqi)]" style={{ background: `linear-gradient(90deg,#fff ${fill * 100}%, #2e2e2e 0)` }} />
              <span className={`mt-[0.6cqi] block truncate font-mono text-[length:max(9px,1cqi)] ${on ? "text-figure" : "text-muted"}`}>{s.id}</span>
            </div>
          );
        })}
        <i className="absolute top-[-0.6cqi] block h-[max(8px,1.4cqi)] w-px bg-white" style={{ left: `${p * 100}%` }} />
      </div>
    </div>
  );
}
