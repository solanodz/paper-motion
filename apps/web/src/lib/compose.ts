import type { Beat } from "@/components/beats-strip";

export type Scripted = { id?: string; title?: string; duration?: number; beats?: Beat[] };

/**
 * Several recipes chosen in order become one script: their beats one block after the other, each block's closing
 * beat dropped except the last one's, so the piece ends once. Returns the combined beats and duration.
 */
export function composeScripts(parts: Scripted[]): { beats: Beat[]; duration: number; title: string } {
  const beats: Beat[] = [];
  let offset = 0;
  parts.forEach((p, i) => {
    const own = p.beats ?? [];
    const last = i === parts.length - 1;
    const kept = last ? own : own.filter((b) => !/^(close|end|hold|outro|seam|erase)/i.test(b.name));
    const span = kept.length ? Math.max(...kept.map((b) => b.to)) : p.duration ?? 0;
    for (const b of kept) beats.push({ ...b, from: +(b.from + offset).toFixed(2), to: +(b.to + offset).toFixed(2) });
    offset += span;
  });
  return { beats, duration: +offset.toFixed(2), title: parts.map((p) => p.title ?? p.id ?? "?").join(" → ") };
}
