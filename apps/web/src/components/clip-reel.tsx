"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptPlayer } from "./script-player";
import type { Theme } from "@/lib/theme";

export type Segment = { name: string; what: string; seconds: number; src?: string };

/**
 * A structure, watched instead of read: each segment plays its rendered clip (a block, shot or recipe) for as long as
 * its beat lasts, cut short or looped to fit, then the next; a segment with no clip shows as a sketch. Loops, and
 * only runs while on screen. Under the picture, a solid bar: a strip of flush segments (the one playing in the look's
 * accent) and the beat's number and name.
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
    <div ref={box} className="flex h-full w-full flex-col overflow-hidden bg-black">
      <div className="relative min-h-0 flex-1">
        {seg.src
          ? <video key={`${i}:${seg.src}`} src={seg.src} autoPlay={visible} muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0"><ScriptPlayer key={`${i}:${seg.name}`} beats={[{ name: seg.name, from: 0, to: seg.seconds, what: seg.what }]} duration={seg.seconds} theme={theme} compact /></div>}
      </div>
      {/* the strip: one segment per beat, as wide as it lasts */}
      <div className="flex shrink-0 gap-px bg-ground">
        {segments.map((s, k) => (
          <span key={k} className="h-1" style={{ flex: s.seconds / total, background: k === i ? c?.accent ?? "#e9e4d8" : "#3a3a3a" }} />
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 bg-ground px-3 py-1.5 font-mono text-[11px] leading-none text-figure">
        <span className="num text-[12px] text-figure">{String(i + 1).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1 truncate">{seg.name}</span>
        <span className="shrink-0 text-muted">{i + 1} of {segments.length}</span>
      </div>
    </div>
  );
}
