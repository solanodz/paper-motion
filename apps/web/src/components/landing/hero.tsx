// The landing's hero: a quiet centred title on flat black that scrambles in, the prompt to copy, the agents it works
// with, three numbers that count up, and a strip of the library's colour running live along the foot.
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { IconArrow, IconGrid } from "@/components/icons";
import { ShaderPreview } from "@/components/shader-preview";
import { getResource } from "@/lib/registry";
import { AGENTS, GRADIENTS } from "./agents";
import { AutoVideo } from "./auto-video";
import { CountUp, Scramble } from "./load-text";

type Entry = { shader: string; props: Record<string, unknown>; image?: string; background?: string };
const entry = (id: string) => getResource(id)?.install.entry as Entry | undefined;

const TITLE = "Video editing without the timeline";
// colour first: library backgrounds running live, with the liquid-metal word (a clip) among them
const STRIP = ["warp-ochre", "mesh-sage", "text-mask", "grain-clay", "metaballs-muted", "simplex-slate"];

function Tile({ id }: { id: string }) {
  const r = getResource(id), e = r?.type === "background" ? entry(id) : undefined;
  return (
    <Link href={`/r/${id}`} className="group relative block aspect-video overflow-hidden bg-black outline-offset-[-2px]">
      {e ? <ShaderPreview entry={e} className="!absolute inset-0" /> : <AutoVideo src={`/previews/${id}.webm`} poster={`/previews/${id}.jpg`} />}
      <span className="absolute bottom-0 left-0 bg-black px-2.5 py-1.5 text-[12.5px] font-medium group-hover:bg-figure group-hover:text-ground">{r?.title ?? id}</span>
    </Link>
  );
}

export function Hero({ prompt, count }: { prompt: string; count: number }) {
  const stats = [[count, "named pieces of motion"], [4, "stages, each one approved by you"], [1, "prompt to start"]] as const;
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-52px)] flex-col overflow-hidden border-b border-line">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center md:px-8">
        <h1 className="max-w-[20ch] text-balance font-serif text-[clamp(44px,6.6vw,108px)] leading-[0.95] tracking-[-0.035em]"><Scramble text={TITLE} duration={1.1} /></h1>
        <p className="mt-7 max-w-[60ch] text-[clamp(16px,1.25vw,19px)] leading-[1.5] text-figure/75">
          <Scramble text={`${count} named pieces of motion that your coding agent puts together into your brand’s video. You decide every stage.`} delay={0.45} duration={1.3} seed={7} />
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CopyButton text={prompt} label="Copy prompt" className="btn-primary !px-4 !py-3 !text-[14px]" />
          <Link href="/library" className="btn !py-3"><IconGrid size={15} />Browse the library</Link>
        </div>
        <Link href="/docs" className="mt-9 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-muted outline-offset-4 hover:text-figure">
          <span className="flex pl-4">
            {AGENTS.map((a, i) => (
              // circles by clip-path (the site zeroes every border-radius): a ground-coloured disc as the gap, the tile inside it
              <span key={a.name} title={a.name} className="relative -ml-4 block h-10 w-10 bg-ground p-[2px] [clip-path:circle(50%)]" style={{ zIndex: AGENTS.length - i }}>
                <span className="flex h-full w-full items-center justify-center [clip-path:circle(50%)]" style={{ background: a.bg }}>
                  <svg viewBox={a.box} aria-hidden width={a.size} height={a.size}>
                    <defs>
                      {a.paths.map((p) => p.fill in GRADIENTS ? (() => { const g = GRADIENTS[p.fill as keyof typeof GRADIENTS]; return (
                        <linearGradient key={p.fill} id={`agent-${p.fill}`} x1="0" y1={g.diagonal ? 1 : 0} x2={g.diagonal ? 1 : 0} y2={g.diagonal ? 0 : 1}>
                          {g.stops.map((c, n) => <stop key={c} offset={n / (g.stops.length - 1)} stopColor={c} />)}
                        </linearGradient>
                      ); })() : null)}
                    </defs>
                    {a.paths.map((p) => <path key={p.d} d={p.d} fill={p.fill in GRADIENTS ? `url(#agent-${p.fill})` : p.fill} fillRule={p.evenodd ? "evenodd" : undefined} clipRule={p.evenodd ? "evenodd" : undefined} />)}
                  </svg>
                </span>
              </span>
            ))}
          </span>
          <span className="text-[13.5px]">Works with the coding agent you already use</span>
          <IconArrow size={14} />
        </Link>
      </div>
      <dl className="grid border-t border-line text-left sm:grid-cols-3">
        {stats.map(([n, l], i) => (
          <div key={l} className={`flex items-center gap-4 px-4 py-4 md:px-8 md:py-5 ${i ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
            <dt className="order-2 text-[13.5px] leading-snug text-muted">{l}</dt>
            <dd className="font-pixel text-[clamp(30px,3.6vw,56px)] leading-none"><CountUp to={n} delay={0.7 + i * 0.15} /></dd>
            {i === 2 ? <CopyButton text={prompt} label="Copy prompt" className="btn btn-sm order-3 ml-auto shrink-0" /> : null}
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-3 gap-px border-t border-line bg-line lg:grid-cols-6">
        {STRIP.map((id) => <Tile key={id} id={id} />)}
      </div>
    </section>
  );
}
