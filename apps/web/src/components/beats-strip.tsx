export type Beat = { name: string; from: number; to: number; what: string; id?: string };

const two = (n: number) => String(n).padStart(2, "0");

/**
 * A recipe's structure as a strip: one cell per beat, as wide as it lasts, numbered in order; the cells share their
 * hairlines. Beats may overlap (a pulse under the words); each one sits on its own row then. Under the strip, the
 * beats by name (compact) or as ruled rows with their seconds and what happens.
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
    <div className={`w-full font-mono ${compact ? "text-[10.5px]" : "text-[11.5px]"}`}>
      <div className="flex flex-col pr-px">
        {rows.map((row, i) => (
          <div key={i} className={`relative ${i ? "-mt-px" : ""} ${compact ? "h-6" : "h-9"}`}>
            {row.map((b) => (
              // one pixel wider than its share, so neighbours share a hairline
              <div key={b.name + b.from} title={`${b.name}, ${b.from}–${b.to} s: ${b.what}`} className="absolute inset-y-0 flex items-center gap-1.5 overflow-hidden border border-rule bg-surface px-2 text-figure" style={{ left: pct(b.from), width: `calc(${pct(b.to - b.from)} + 1px)` }}>
                {/* a name only where it fits; the list under the strip names every beat */}
                {(b.to - b.from) / total >= (compact ? 0.22 : 0.1) ? <><span className="num text-[1.1em]">{two(beats.indexOf(b) + 1)}</span><span className="truncate">{b.name}</span></> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      {compact ? (
        <div className="mt-2 flex items-start gap-3">
          <ol className="flex min-w-0 flex-1 flex-wrap gap-y-1 text-muted">
            {beats.map((b) => <li key={b.name + b.from} className="border-l border-rule px-2 first:border-l-0 first:pl-0">{b.name}</li>)}
          </ol>
          <span className="shrink-0 text-faint">{total} s</span>
        </div>
      ) : (
        <>
          <div className="mt-1.5 flex justify-between text-faint"><span>0 s</span><span>{total} s</span></div>
          <ol className="mt-4 border-t border-rule font-sans text-[13px]">
            {beats.map((b, i) => (
              <li key={b.name + b.from} className="grid grid-cols-[22px_66px_minmax(0,1fr)] items-baseline gap-x-2 border-b border-line py-2.5">
                <span className="num text-[14px]">{two(i + 1)}</span>
                <span className="font-mono text-[11px] text-faint">{b.from}–{b.to} s</span>
                <span className="flex min-w-0 flex-wrap gap-x-2 leading-snug"><span className="text-figure">{b.name}</span><span className="text-muted">{b.what}</span></span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
