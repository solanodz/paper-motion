// The landing: the hero; the making of paper-motion's own film, stage by stage, beside a monitor where it takes shape
// (real library blocks on a brand-sheet tint); the library as a live mosaic; and the prompt again.
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { AutoVideo } from "./auto-video";
import { ShaderPreview } from "@/components/shader-preview";
import { IconArrow, IconGrid } from "@/components/icons";
import { starterPrompt } from "@/lib/prompt";
import { getIndex, getResource } from "@/lib/registry";
import { MakingOf, type Look } from "./making-of";
import { Hero } from "./hero";

type Entry = { shader: string; props: Record<string, unknown>; image?: string; background?: string };
const entry = (id: string) => getResource(id)?.install.entry as Entry | undefined;

// the four looks on the board: library backgrounds in the brand sheet's tints, dark enough to carry white type
function looks(): Look[] {
  const mk = (id: string, label: string, title: string, tint: string): Look | null => {
    const e = entry(id);
    return e ? { id, label, title, tint, entry: e } : null;
  };
  return [
    mk("mesh-sage", "A", "Sage", "#8FA67A"),
    mk("neuro-slate", "B", "Slate", "#8EA3AD"),
    mk("grain-clay", "C", "Clay", "#B07D73"),
    mk("warp-ochre", "D", "Ochre", "#C9A65A"),
  ].filter(Boolean) as Look[];
}

// the mosaic: backgrounds run live as shaders, everything else plays its preview; `big` cells take 2 x 2
const MOSAIC: { id: string; kind: string; live?: boolean; big?: boolean }[] = [
  { id: "warp-ochre", kind: "background", live: true, big: true },
  { id: "parallax-stack", kind: "block" },
  { id: "mesh-sage", kind: "background", live: true },
  { id: "code-type", kind: "block" },
  { id: "liquid-metal", kind: "background", live: true },
  { id: "magic-move", kind: "component transition" },
  { id: "grain-clay", kind: "background", live: true },
  { id: "donut-fill", kind: "block", big: true },
  { id: "zoom-through", kind: "transition" },
  { id: "neuro-slate", kind: "background", live: true },
];

export function Landing() {
  const { site, count } = getIndex();
  const PROMPT = starterPrompt(site);

  return (
    <>
      <Hero prompt={PROMPT} count={count} />

      <MakingOf count={count} looks={looks()} />

      {/* the library, alive: backgrounds running as shaders, blocks and moves playing, in one mosaic */}
      <section className="border-b border-line">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 px-4 pb-7 pt-16 md:px-8 md:pt-24">
          <p className="max-w-[40ch] font-serif text-[clamp(24px,2.4vw,34px)] leading-[1.15] tracking-[-0.015em]">
            Everything on that monitor comes from the library: {count} backgrounds, blocks, transitions and type moves your agent can name.
          </p>
          <Link href="/library" className="btn"><IconGrid size={15} />Browse the library<IconArrow size={15} /></Link>
        </div>
        <div className="grid grid-flow-dense grid-cols-2 gap-px border-t border-line bg-line [grid-auto-rows:clamp(130px,38vw,200px)] lg:grid-cols-4 lg:[grid-auto-rows:clamp(150px,15.5vw,250px)]">
          {MOSAIC.map((m) => {
            const r = getResource(m.id), e = m.live ? entry(m.id) : undefined;
            return (
              <Link key={m.id} href={`/r/${m.id}`} className={`group relative block overflow-hidden bg-black outline-offset-[-2px] ${m.big ? "col-span-2 row-span-2" : ""}`}>
                {e ? <ShaderPreview entry={e} className="!absolute inset-0" /> : <AutoVideo src={`/previews/${m.id}.webm`} poster={`/previews/${m.id}.jpg`} />}
                <span className="absolute bottom-0 left-0 flex items-baseline gap-3 bg-black px-3 py-2 group-hover:bg-figure group-hover:text-ground">
                  <span className="text-[14px] font-medium">{r?.title ?? m.id}</span>
                  <span className="font-mono text-[11.5px] text-muted group-hover:text-ground/60">{m.kind}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* the close: the prompt once more, where it gets said: a terminal, your agent waiting */}
      <section className="px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24">
        <style>{`@keyframes term-caret { 50% { opacity: 0 } } .term-caret { animation: term-caret 1.05s steps(1) infinite } @media (prefers-reduced-motion: reduce) { .term-caret { animation: none } }`}</style>
        <div className="mx-auto max-w-[1100px] border border-rule">
          <p className="flex items-center gap-2 border-b border-line px-4 py-2.5 font-mono text-[12px] text-muted">
            {[0, 1, 2].map((k) => <i key={k} className="block h-2 w-2 bg-rule" />)}
            <span className="ml-3">~/my-brand, your coding agent</span>
          </p>
          <div className="px-4 py-6 font-mono text-[clamp(14px,1.35vw,19px)] leading-[1.7] md:px-6 md:py-8">
            <p className="text-muted">Start a film the same way this one started.</p>
            <p className="mt-4 grid grid-cols-[1.4em_minmax(0,1fr)] [overflow-wrap:anywhere]">
              <span className="text-paper">&gt;</span>
              <span>{PROMPT}<i aria-hidden className="term-caret ml-[0.15em] inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] bg-paper" /></span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 md:px-6">
            <CopyButton text={PROMPT} label="Copy prompt" className="btn-primary !px-4 !py-3 !text-[14px]" />
            <Link href="/docs" className="btn !py-3">How agents use it<IconArrow size={15} /></Link>
            <span className="text-[13px] text-muted md:ml-3">Free and MIT; the scenes land in your project as files you own.</span>
          </div>
        </div>
      </section>
    </>
  );
}
