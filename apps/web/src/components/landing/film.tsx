"use client";

// The film on the landing's monitor is a real one: paper-motion's own promo, 16:9, rendered frame by frame by the
// engine from examples/paper-motion-brand/pieces/landing-film-wide/scene.html (30 s, supersampled at 4K, motion blur).
// Nothing is drawn here. The six scene clips (part-*.webm) are the library blocks the "What you say" step lists.
// Re-render from examples/paper-motion-brand with
// `pamo render pieces/landing-film-wide/scene.html --dpr 2 --motion-blur 4`, then encode film-wide.webm and film-wide.jpg.
import { useEffect, useRef, useState } from "react";
import { AutoVideo } from "@/components/landing/auto-video";

export const SCENES = [
  { id: "beat-cuts", beat: "The hook", d: 3.0 },
  { id: "grain-clay", beat: "How it looks", d: 3.11 },
  { id: "search-type", beat: "The library", d: 5.1 },
  { id: "stat-row", beat: "The numbers", d: 4.26 },
  { id: "terminal-run", beat: "The agent", d: 4.91 },
  { id: "scramble", beat: "One prompt", d: 4.75 },
  { id: "text-mask", beat: "Liquid metal", d: 4.87 },
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
  const video = <AutoVideo src={`${BASE}/film-wide.webm`} poster={`${BASE}/film-wide.jpg`} />;
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
