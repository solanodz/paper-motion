/** The library read out loud, large: names sliding past, one solid, one in outline. Pointing at it holds it still. */
export function Ticker({ names }: { names: string[] }) {
  return (
    <div className="marquee overflow-hidden border-b border-line py-7 md:py-10" aria-hidden>
      <div className="ticker-row items-center">
        {[...names, ...names].map((n, k) => (
          <span key={k} className="flex items-center gap-[0.35em] pr-[0.35em] font-serif text-[64px] leading-none tracking-[-0.03em] md:text-[104px] xl:text-[132px]">
            <span className={k % 2 ? "outline-text" : ""}>{n}</span>
            <i className="block h-[0.14em] w-[0.14em] shrink-0 bg-paper" />
          </span>
        ))}
      </div>
    </div>
  );
}
