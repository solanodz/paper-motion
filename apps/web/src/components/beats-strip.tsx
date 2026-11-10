export type Beat = { name: string; from: number; to: number; what: string; id?: string };

/**
 * A recipe's structure as a strip: one bar per beat, proportional to its length, the names above, the seconds below.
 * Beats may overlap (a pulse under the words); each bar sits on its own row then.
 */
export function BeatsStrip({ beats, duration, compact = false }: { beats: Beat[]; duration?: number; compact?: boolean }) {
  if (!beats?.length) return null;
  const total = duration ?? Math.max(...beats.map((b) => b.to));
  // rows: a beat goes on the first row where it does not overlap the previous beat
  const rows: Beat[][] = [];
  for (const b of beats) {
    const row = rows.find((r) => r[r.length - 1].to <= b.from + 0.05);
    if (row) row.push(b); else rows.push([b]);
  }
  const pct = (v: number) => `${(v / total) * 100}%`;
  return (
    <div className={`w-full ${compact ? "text-[10px]" : "text-[11.5px]"} font-mono`}>
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div key={i} className={`relative ${compact ? "h-6" : "h-8"}`}>
            {row.map((b) => (
              <div key={b.name + b.from} title={`${b.name} · ${b.from}–${b.to} s · ${b.what}`} className="absolute top-0 flex h-full items-center overflow-hidden rounded-[3px] border border-line bg-raised px-1.5 text-figure" style={{ left: pct(b.from), width: `calc(${pct(b.to - b.from)} - 2px)` }}>
                {/* a name only where it fits; the line under the strip names every beat */}
                {(b.to - b.from) / total >= (compact ? 0.22 : 0.1) ? <span className="truncate">{b.name}</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-3 text-faint"><span className="truncate text-muted">{beats.map((b) => b.name).join(" · ")}</span><span className="shrink-0">{total} s</span></div>
      {!compact ? (
        <ul className="mt-3 space-y-1 text-[12.5px] font-sans text-muted">
          {beats.map((b) => <li key={b.name + b.from} className="flex gap-3"><span className="w-[88px] shrink-0 font-mono text-[11px] text-faint">{b.from}–{b.to} s</span><span><span className="text-figure">{b.name}</span> · {b.what}</span></li>)}
        </ul>
      ) : null}
    </div>
  );
}
