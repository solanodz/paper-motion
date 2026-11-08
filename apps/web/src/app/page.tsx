import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { IconAgent, IconArrow, IconCheck, IconGrid, IconKit, TYPE_ICONS } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { getIndex, TYPES } from "@/lib/registry";

const prompt = (site: string) => `Use ${site.replace(/^https?:\/\//, "")} to make a video for my brand. Read ${site}/llms.txt first, interview me, then propose options as board links I can open.`;
const FEATURED = ["magic-move", "dive-in", "whip-pan", "mesh-sage", "sage-night", "instrument"];

const STEPS = [
  { icon: IconAgent, t: "Your agent proposes", d: "It reads your brand, picks from the library and sends you a board: a link with 2 to 4 options." },
  { icon: IconCheck, t: "You choose on the board", d: "The options play live, in your colors and fonts. Tune one if you like, pick it, paste one line back." },
  { icon: IconKit, t: "It builds the video", d: "Every choice lands in your kit. The agent installs it as code you own and renders the piece with you." },
];

export default function Home() {
  const { items, count, site } = getIndex();
  const PROMPT = prompt(site);
  const featured = FEATURED.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);
  return (
    <>
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <div className="flex items-center gap-2 font-mono text-[12.5px] text-muted">
            <span className="inline-block h-2 w-2 animate-pulse bg-paper" /> {count} resources · free · yours to edit
          </div>
          <h1 className="mt-6 max-w-[15ch] font-serif text-[54px] leading-[0.95] tracking-[-0.03em] sm:text-[84px] md:text-[112px]">
            Motion your agent can use.
          </h1>
          <p className="mt-7 max-w-[54ch] text-[17px] leading-relaxed text-muted md:text-[19px]">
            A library of backgrounds, transitions, text effects, palettes, fonts and video recipes, built for AI agents.
            Yours proposes, you choose, it renders.
          </p>

          <div className="corner-marks mt-12 max-w-[820px] rounded-xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <span className="flex items-center gap-2 text-[13.5px] font-medium"><IconAgent size={15} className="text-paper" /> Start here: say this to your agent</span>
              <CopyButton text={PROMPT} label="Copy prompt" />
            </div>
            <p className="px-5 py-5 font-mono text-[14.5px] leading-relaxed text-figure md:text-[15.5px]">{PROMPT}</p>
            <p className="border-t border-line px-5 py-3 text-[12.5px] text-muted">Works in Claude Code, Codex, Cursor and any agent that reads the web and runs commands.</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/library" className="flex items-center gap-2 text-[14px] text-figure underline decoration-faint underline-offset-4 hover:decoration-figure"><IconGrid size={15} /> Browse the library yourself</Link>
            <Link href="/docs" className="text-[14px] text-muted hover:text-figure">How agents use it →</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
          <h2 className="font-serif text-[40px] leading-none tracking-[-0.02em] md:text-[54px]">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="border-t border-line pt-5">
                <div className="flex items-center justify-between"><s.icon size={18} className="text-paper" /><span className="font-pixel text-[22px] text-faint">0{i + 1}</span></div>
                <h3 className="mt-4 text-[18px] font-medium">{s.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 font-mono text-[11.5px] text-faint"><span className="h-2 w-2 rounded-full bg-paper" /> a board, as your agent would send it</div>
              <div className="grid grid-cols-4 gap-2 p-3">
                {["mesh-graphite", "neuro-slate", "dither-slate", "grain-slate"].map((id, i) => (
                  <div key={id} className="relative aspect-video overflow-hidden rounded-md border border-line bg-black">
                    <img src={`/previews/${id}.jpg`} alt="" className="h-full w-full object-cover opacity-70" onError={undefined} />
                    <span className="absolute left-1.5 top-1.5 rounded bg-ground/80 px-1.5 font-mono text-[10.5px] text-figure">{"ABCD"[i]}</span>
                  </div>
                ))}
              </div>
              <p className="border-t border-line px-4 py-2.5 font-mono text-[12px] text-muted">paper-motion: C · dither-slate --set colorFront=#3d6bff</p>
            </div>
            <p className="max-w-[30ch] text-[14px] leading-relaxed text-muted">You open the link, pick one, paste the line. That is the whole handoff.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-[40px] leading-none tracking-[-0.02em] md:text-[54px]">In the library</h2>
          <Link href="/library" className="hidden items-center gap-2 text-[13.5px] text-muted hover:text-figure sm:flex">All {count} <IconArrow size={14} /></Link>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => <ResourceCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-x-8 px-5 py-14 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {TYPES.map((t) => {
            const n = items.filter((i) => i.type === t.type).length, Icon = TYPE_ICONS[t.type];
            return (
              <Link key={t.type} href={`/library?type=${t.type}`} className="group flex gap-3.5 border-t border-line py-6">
                <Icon size={18} className="mt-0.5 shrink-0 text-faint group-hover:text-paper" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2"><span className="text-[15px] font-medium group-hover:text-paper">{t.title}</span><span className="font-mono text-[11px] text-faint">{n}</span></div>
                  <p className="mt-1.5 text-[13px] leading-snug text-muted">{t.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
