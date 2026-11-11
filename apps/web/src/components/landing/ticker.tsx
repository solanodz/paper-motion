/** Two lines of resource names sliding past each other: the library, read out loud. */
export function Ticker({ names }: { names: string[] }) {
  const half = Math.ceil(names.length / 2);
  const rows = [names.slice(0, half), names.slice(half)];
  return (
    <div className="overflow-hidden border-b border-line py-3" aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className={`ticker-row ${r ? "ticker-back" : ""}`}>
          {[...row, ...row].map((n, k) => (
            <span key={k} className="flex items-center gap-5 pr-5 font-mono text-[13px] text-muted">
              {n}
              <i className="block h-[5px] w-[5px] bg-paper" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
