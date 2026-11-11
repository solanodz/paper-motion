"use client";

// The making of the film: a pinned editorial page on black, every color held back for the shaders inside the monitor.
// Left, the stage: its number in pixel, its name very large in serif, one plain sentence, and the command it runs as a
// footnote. Right, the monitor: paper-motion's own film taking shape, each scene brought in by a transition from the
// library. Along the bottom, six ruled cells, the current one in paper. Scroll back and it rewinds. On a phone nothing
// pins: the stages stack.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { IconCheck, IconTransition } from "@/components/icons";
import { FX, STAGES, type Fx } from "./making-of-data";
import { Screen, isFilm, type Look } from "./making-of-screens";

export type { Look };

const FX_MS: Record<Fx, number> = { "": 0, cut: 0, wipe: 620, slices: 760, iris: 700, whip: 560, "zoom-through": 620 };

// the scroll, in units: the opening, one unit per stage, a short hold on the last frame
const COLD = 0.5, TAIL = 0.4, UNITS = COLD + STAGES.length + TAIL, VH_PER_UNIT = 58;
// inside a stage: the name is already there; the command types itself, the monitor cuts, then its output lands
const TYPE_FROM = 0.12, TYPE_TO = 0.42, ENTER = 0.46, OUT = 0.64;
const HEAD = 52; // the site header

// the split: the page gives the monitor more room when it shows the board and the finished film
const COLS = { open: "minmax(0,4.9fr) minmax(0,7.1fr)", stage: "minmax(0,4.3fr) minmax(0,7.7fr)", wide: "minmax(0,3.5fr) minmax(0,8.5fr)" };

const QUERY = "(prefers-reduced-motion: reduce)";
const useReducedMotion = () =>
  useSyncExternalStore(
    (on) => { const m = matchMedia(QUERY); m.addEventListener("change", on); return () => m.removeEventListener("change", on); },
    () => matchMedia(QUERY).matches,
    () => false,
  );

const STYLE = `
  .mko-paper ::selection { background: #e9e4d8; color: #000 }
  .mko-paper :focus-visible { outline-color: #e9e4d8 }
  @keyframes mko-blink { 50% { opacity: 0 } }
  .mko-cursor { animation: mko-blink 1.05s steps(1) infinite }
  @keyframes mko-turn { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
  .mko-turn { animation: mko-turn .55s cubic-bezier(.2,.7,.2,1) both }
  @keyframes mko-wipe { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
  @keyframes mko-wipe-back { from { clip-path: inset(0 0 0 100%) } to { clip-path: inset(0 0 0 0) } }
  .mko-in-wipe { animation: mko-wipe .62s cubic-bezier(.75,0,.2,1) both }
  .mko-in-wipe.mko-back { animation-name: mko-wipe-back }
  @keyframes mko-iris { from { clip-path: circle(0% at 50% 50%) } to { clip-path: circle(75% at 50% 50%) } }
  .mko-in-iris { animation: mko-iris .7s cubic-bezier(.7,0,.25,1) both }
  @keyframes mko-whip-in { from { transform: translateX(105%) skewX(-8deg); filter: blur(14px) } to { transform: none; filter: none } }
  @keyframes mko-whip-out { to { transform: translateX(-105%) skewX(-8deg); filter: blur(14px) } }
  @keyframes mko-whip-in-b { from { transform: translateX(-105%) skewX(8deg); filter: blur(14px) } to { transform: none; filter: none } }
  @keyframes mko-whip-out-b { to { transform: translateX(105%) skewX(8deg); filter: blur(14px) } }
  .mko-in-whip { animation: mko-whip-in .56s cubic-bezier(.8,0,.2,1) both }
  .mko-out-whip { animation: mko-whip-out .56s cubic-bezier(.8,0,.2,1) both }
  .mko-in-whip.mko-back { animation-name: mko-whip-in-b } .mko-out-whip.mko-back { animation-name: mko-whip-out-b }
  @keyframes mko-zoom-in { 0%, 30% { transform: scale(.4); opacity: 0 } 100% { transform: none; opacity: 1 } }
  @keyframes mko-zoom-out { to { transform: scale(3.2); opacity: 0 } }
  .mko-in-zoom-through { animation: mko-zoom-in .62s cubic-bezier(.6,0,.2,1) both }
  .mko-out-zoom-through { animation: mko-zoom-out .45s cubic-bezier(.7,0,.9,.4) both }
  @keyframes mko-slice { 0% { transform: translateY(-101%) } 40%, 60% { transform: none } 100% { transform: translateY(101%) } }
  .mko-slice { animation: mko-slice .7s cubic-bezier(.7,0,.3,1) both }
  @keyframes mko-late { 0%, 99% { visibility: hidden } 100% { visibility: visible } }
  .mko-in-slices { animation: mko-late .34s both }
  @media (prefers-reduced-motion: reduce) {
    .mko-cursor, .mko-turn, .mko-in-wipe, .mko-in-iris, .mko-in-whip, .mko-out-whip, .mko-in-zoom-through, .mko-out-zoom-through, .mko-in-slices, .mko-slice { animation: none }
    .mko-slice { display: none }
  }
`;

type Props = { count: number; looks: Look[] };

export function MakingOf(props: Props) {
  return (
    <div className="mko-paper bg-ground text-figure">
      <style>{STYLE}</style>
      <div className="max-lg:hidden"><Pinned {...props} /></div>
      <div className="lg:hidden"><Stacked {...props} /></div>
    </div>
  );
}

const Cursor = () => <span aria-hidden className="mko-cursor -mr-[0.6em] inline-block h-[1.05em] w-[0.6em] translate-y-[0.18em] bg-figure" />;
const pad2 = (k: number) => String(k).padStart(2, "0");

/** The command a stage runs, as a footnote: typed up to `chars`, its output once `out`. */
function Footnote({ cmd, out, result, chars, live }: { cmd: string; out: boolean; result: string; chars: number; live: boolean }) {
  return (
    <div className="max-w-[52ch] border-t border-line pt-3.5 font-mono text-[12px] leading-[1.6]">
      <p className="grid grid-cols-[14px_minmax(0,1fr)] gap-1">
        <span className="text-figure/40">$</span>
        <span className="[overflow-wrap:anywhere]">{cmd.slice(0, chars)}{live && !out ? <Cursor /> : null}<span className="invisible">{cmd.slice(chars)}</span></span>
      </p>
      <p className={`grid grid-cols-[14px_minmax(0,1fr)] gap-1 text-figure/65 ${out ? "" : "invisible"}`}>
        <span className="text-figure/40">└</span>
        <span className="[overflow-wrap:anywhere]"><i aria-hidden className="mr-2 inline-block h-[7px] w-[7px] -translate-y-px bg-figure" />{result}{live && out ? <Cursor /> : null}</span>
      </p>
    </div>
  );
}

// ─── desktop: the pinned page ──────────────────────────────────────────────────────
function Pinned({ count, looks }: Props) {
  const reduce = useReducedMotion();
  const section = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0); // where the film is, in units

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const range = el.offsetHeight - (innerHeight - HEAD);
      const scrolled = HEAD - el.getBoundingClientRect().top;
      setT(Math.min(1, Math.max(0, scrolled / Math.max(1, range))) * UNITS);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // idx 0 is the opening; 1..6 the stages; u the progress inside the current stage
  const idx = t < COLD ? 0 : Math.min(STAGES.length, Math.floor(t - COLD) + 1);
  const u = idx === 0 ? 0 : Math.min(1, Math.max(0, t - COLD - (idx - 1)));
  const shown = idx === 0 ? 0 : u >= ENTER ? idx : idx - 1;
  const done = shown < idx || u >= OUT;
  const cols = idx === 0 ? COLS.open : idx === 2 || idx === 6 ? COLS.wide : COLS.stage;

  const goTo = (k: number) => {
    const el = section.current;
    if (!el) return;
    const range = el.offsetHeight - (innerHeight - HEAD);
    const at = k === 0 ? 0 : COLD + (k - 1) + 0.8;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - HEAD + (at / UNITS) * range, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div ref={section} style={{ height: `calc(100dvh - ${HEAD}px + ${(UNITS * VH_PER_UNIT).toFixed(0)}vh)` }} className="relative">
      <div className="sticky top-[52px] grid h-[calc(100dvh-52px)] grid-rows-[minmax(0,1fr)_auto]">
        <div className="grid min-h-0 transition-[grid-template-columns] duration-700 ease-[cubic-bezier(.6,0,.2,1)] motion-reduce:transition-none" style={{ gridTemplateColumns: cols }}>
          <Page count={count} idx={idx} u={u} reduce={reduce} />
          <Monitor shown={shown} done={done} looks={looks} reduce={reduce} />
        </div>
        <Cells idx={idx} u={u} onPick={goTo} />
      </div>
    </div>
  );
}

/** The left page: the opening spread, then one stage at a time. */
function Page({ count, idx, u, reduce }: { count: number; idx: number; u: number; reduce: boolean }) {
  let body: ReactNode;
  if (idx === 0) {
    body = (
      <div key="open" className="mko-turn">
        <h2 className="font-serif text-[length:min(11.6cqi,11vh)] leading-[0.94] tracking-[-0.035em]">The making of a thirty-second film</h2>
        <p className="mt-[3.2vh] max-w-[44ch] text-[length:clamp(15px,1.15vw,17px)] leading-[1.5] text-figure/70">
          This is paper-motion&rsquo;s own film, put together by a coding agent from {count} named pieces of motion. Scroll, and watch the six stages it went through, each one decided by a person.
        </p>
      </div>
    );
  } else {
    const s = STAGES[idx - 1];
    const typing = Math.min(1, Math.max(0, (u - TYPE_FROM) / (TYPE_TO - TYPE_FROM)));
    const chars = reduce ? (u >= TYPE_FROM ? s.cmd.length : 0) : Math.ceil(typing * s.cmd.length);
    body = (
      <div key={idx} className="mko-turn">
        <p className="font-pixel text-[length:clamp(22px,2vw,30px)] leading-none">{pad2(idx)}<span className="text-figure/30"> / 06</span></p>
        <h2 className="-ml-[0.05em] mt-[2.4vh] font-serif leading-[0.86] tracking-[-0.045em]" style={{ fontSize: `min(25vh, ${(100 / (s.name.length * 0.5)).toFixed(1)}cqi)` }}>{s.name}</h2>
        <p className="mt-[4.5vh] max-w-[30ch] text-[length:clamp(17px,1.45vw,22px)] leading-[1.38] text-figure/80">{s.says}</p>
        <div className="mt-[5vh]"><Footnote cmd={s.cmd} result={s.out} chars={chars} out={u >= OUT} live /></div>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden px-10 py-[5vh] xl:px-14">
      <div className="@container my-auto w-full">{body}</div>
    </div>
  );
}

/** The monitor: the state that is leaving stays underneath while the new one comes in with its stage's transition. */
function Monitor({ shown, done, looks, reduce }: { shown: number; done: boolean; looks: Look[]; reduce: boolean }) {
  const [sw, setSw] = useState<{ cur: number; prev: number | null; fx: Fx; back: boolean; n: number }>({ cur: shown, prev: null, fx: "", back: false, n: 0 });

  // a new stage reached the monitor: swap during render (React's "adjust state when a prop changes")
  if (sw.cur !== shown) {
    const back = shown < sw.cur;
    const fx: Fx = reduce ? "cut" : FX[back ? sw.cur : shown];
    setSw({ cur: shown, prev: FX_MS[fx] ? sw.cur : null, fx, back, n: sw.n + 1 });
  }

  useEffect(() => {
    if (sw.prev === null) return;
    const id = setTimeout(() => setSw((s) => ({ ...s, prev: null })), FX_MS[sw.fx] + 40);
    return () => clearTimeout(id);
  }, [sw.n, sw.prev, sw.fx]);

  const back = sw.back ? "mko-back" : "";
  const layer = "absolute inset-0 overflow-hidden bg-ground";
  const label = FX[sw.cur];
  const caption = sw.cur === 0 ? "paper-motion's own film: six blocks from the library, rendered by the engine. Scroll to watch it get made." : STAGES[sw.cur - 1].caption;
  // the monitor is as wide as the column allows, or as wide as its height allows at 16:9 (leaving room for the caption)
  const size: CSSProperties = { width: "min(100cqw, calc((100cqh - 56px) * 16 / 9))" };

  return (
    <div className="flex min-h-0 min-w-0 flex-col py-[4.5vh] pl-2 pr-10 xl:pr-14">
      <div className="relative min-h-0 flex-1 [container-type:size]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={size}>
          <div className="@container relative aspect-video overflow-hidden bg-black text-figure ring-1 ring-line">
            {sw.prev !== null ? (
              <div key={`p${sw.n}`} className={`${layer} mko-out-${sw.fx} ${back}`}>
                <Screen stage={sw.prev} done looks={looks} still={reduce} />
              </div>
            ) : null}
            <div key={`c${sw.cur}`} className={`${layer} ${sw.prev !== null ? `mko-in-${sw.fx} ${back}` : ""}`}>
              <Screen stage={sw.cur} done={sw.cur === shown ? done : true} looks={looks} still={reduce} />
            </div>
            {sw.prev !== null && sw.fx === "slices" ? (
              <div key={`s${sw.n}`} aria-hidden className="pointer-events-none absolute inset-0 flex">
                {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="mko-slice block h-full flex-1 bg-figure" style={{ animationDelay: `${(sw.back ? 5 - k : k) * 24}ms` }} />)}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex h-11 items-start justify-between gap-6 border-t border-line pt-2.5">
            <p key={`t${sw.cur}`} className="mko-turn min-w-0 text-[13px] leading-snug text-figure/70">{caption}</p>
            {label ? (
              <span key={`f${sw.n}`} className="flex shrink-0 items-center gap-2 font-mono text-[11.5px] text-figure/55">
                <IconTransition size={13} /><span>{label}<span className="max-xl:hidden">, from the library</span></span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Six ruled cells along the foot of the page, the only progress: the current one inverted, a hairline filling under it. */
function Cells({ idx, u, onPick }: { idx: number; u: number; onPick: (k: number) => void }) {
  return (
    <nav aria-label="The six stages" className="grid h-[68px] grid-cols-6 border-t border-line">
      {STAGES.map((s, i) => {
        const k = i + 1;
        const on = k === idx, ok = k < idx || (on && u >= OUT);
        const fill = on ? Math.min(1, u / OUT) : 0;
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onPick(k)}
            aria-current={on ? "step" : undefined}
            className={`relative flex min-w-0 items-center gap-3 px-5 text-left outline-offset-[-3px] xl:px-6 ${i ? "border-l border-line" : ""} ${on ? "bg-paper text-ground" : ok ? "text-figure hover:bg-figure hover:text-ground" : "text-figure/45 hover:bg-figure hover:text-ground"}`}
            style={on ? { outlineColor: "#000" } : undefined}
          >
            <span className="font-pixel text-[22px] leading-none">{pad2(k)}</span>
            <span className="truncate text-[15px] font-medium">{s.name}</span>
            {ok ? <IconCheck size={14} className="ml-auto shrink-0" /> : null}
            {on ? <i aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-ground" style={{ transform: `scaleX(${fill})` }} /> : null}
          </button>
        );
      })}
    </nav>
  );
}

// ─── phone and small tablet: the same page, stacked ───────────────────────────────
function Stacked({ count, looks }: Props) {
  const reduce = useReducedMotion();
  const monitor = (stage: number) => (
    <div className={`@container relative overflow-hidden bg-black text-figure ring-1 ring-line ${isFilm(stage) ? "aspect-video" : ""}`}>
      <Screen stage={stage} done looks={looks} still={reduce} free />
    </div>
  );
  return (
    <div>
      <section className="px-4 pb-12 pt-10 sm:px-8">
        <h2 className="font-serif text-[clamp(40px,11vw,72px)] leading-[0.94] tracking-[-0.035em]">The making of a thirty-second film</h2>
        <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.5] text-figure/70">
          This is paper-motion&rsquo;s own film, put together by a coding agent from {count} named pieces of motion. Below, the six stages it went through, each one decided by a person.
        </p>
        <div className="mt-10">{monitor(0)}</div>
        <p className="mt-3 border-t border-line pt-2.5 text-[13px] text-figure/70">paper-motion&rsquo;s own film: six blocks from the library. Below, how it gets made.</p>
      </section>
      {STAGES.map((s, i) => (
        <section key={s.name} className="border-t border-line px-4 pb-12 pt-6 sm:px-8">
          <p className="font-pixel text-[22px] leading-none">{pad2(i + 1)}<span className="text-figure/30"> / 06</span></p>
          <h2 className="-ml-[0.04em] mt-3 font-serif text-[clamp(64px,19vw,120px)] leading-[0.86] tracking-[-0.045em]">{s.name}</h2>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-[1.42] text-figure/80">{s.says}</p>
          <div className="mt-7">{monitor(i + 1)}</div>
          <div className="mt-3 flex items-start justify-between gap-4 border-t border-line pt-2.5">
            <p className="min-w-0 text-[13px] leading-snug text-figure/70">{s.caption}</p>
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-figure/55"><IconTransition size={12} />{FX[i + 1]}</span>
          </div>
          <div className="mt-7"><Footnote cmd={s.cmd} result={s.out} chars={s.cmd.length} out live={false} /></div>
        </section>
      ))}
    </div>
  );
}
