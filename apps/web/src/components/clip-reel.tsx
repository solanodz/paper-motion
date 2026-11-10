"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptPlayer } from "./script-player";
import type { Theme } from "@/lib/theme";

export type Segment = { name: string; what: string; seconds: number; src?: string };

/**
 * A structure, watched instead of read: each segment plays its rendered clip (a block, shot or recipe) for as long as
 * its beat lasts, cut short or looped to fit, then the next; a segment with no clip shows as a sketch. Loops, and
 * only runs while on screen. A strip at the bottom marks which beat is playing.
 */
export function ClipReel({ segments, theme }: { segments: Segment[]; theme?: Theme }) {
  // a new set of segments starts the reel over
  return <Reel key={segments.map((s) => `${s.src ?? s.name}:${s.seconds}`).join("|")} segments={segments} theme={theme} />;
}

function Reel({ segments, theme }: { segments: Segment[]; theme?: Theme }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const seg = segments[i % segments.length];
  useEffect(() => {
    if (!visible || !seg) return;
    const id = setTimeout(() => setI((n) => (n + 1) % segments.length), seg.seconds * 1000);
    return () => clearTimeout(id);
  }, [visible, seg, i, segments.length]);
  if (!seg) return null;
  const total = segments.reduce((a, s) => a + s.seconds, 0);
  const c = theme?.palette;
  return (
    <div ref={box} className="relative h-full w-full overflow-hidden bg-black">
      {seg.src
        ? <video key={`${i}:${seg.src}`} src={seg.src} autoPlay={visible} muted loop playsInline className="h-full w-full object-cover" />
        : <ScriptPlayer key={`${i}:${seg.name}`} beats={[{ name: seg.name, from: 0, to: seg.seconds, what: seg.what }]} duration={seg.seconds} theme={theme} compact />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-6">
        <div className="mb-1.5 truncate font-mono text-[11px] text-white/85">{i + 1}/{segments.length} · {seg.name}</div>
        <div className="flex gap-[3px]">
          {segments.map((s, k) => (
            <span key={k} className="h-[3px] rounded-full" style={{ flex: s.seconds / total, background: k === i ? c?.accent ?? "#e9e4d8" : "rgba(255,255,255,.28)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
