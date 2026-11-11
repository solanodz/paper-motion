import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { IconAgent, IconArrow, IconGrid, TYPE_ICONS } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { ShaderPreview } from "@/components/shader-preview";
import { getIndex, getResource, TYPES } from "@/lib/registry";

const prompt = (site: string) => `Use ${site.replace(/^https?:\/\//, "")} to make a video for my brand. Read ${site}/llms.txt first, interview me, then let me decide each step in the paper-motion studio and on board links I can open.`;
const FEATURED = ["magic-move", "dive-in", "whip-pan", "mesh-sage", "sage-night", "instrument"];

// the six stages of a piece, the same ones the studio shows
const STAGES = [
  { t: "Brief", d: "Your agent interviews you and writes what the video says, to whom and for how long. You edit it by hand." },
  { t: "Look", d: "It proposes palettes, type, backgrounds and moves on boards. You open each one and pick." },
  { t: "Structure", d: "The beats of the video, each one shown by a ready-made block from the library." },
  { t: "Parts", d: "Every part rendered in your brand. Approve it, ask for a change, or fix its words yourself." },
  { t: "Assembly", d: "The parts joined, with their transitions. Change a length or drag one to another place." },
  { t: "Final", d: "The full-quality render, in the shapes you need." },
];

export default function Home() {
  const { items, count, site } = getIndex();
  const PROMPT = prompt(site);
  const featured = FEATURED.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);
  return (
    <>
      <section className="grid-bg border-b border-line">
        <div className="px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
          <h1 className="display max-w-[12ch]">Motion your agent can use.</h1>
          <p className="mt-8 max-w-[56ch] text-[17px] leading-relaxed text-muted md:text-[19px]">
            {count} moves, backgrounds, palettes, type pairs and ready-made blocks, built for AI agents. Yours proposes,
            you decide each stage in a studio, and the video renders on your machine.
          </p>

          <div className="corner-marks mt-12 max-w-[860px] border border-rule bg-ground">
            <div className="flex items-stretch justify-between border-b border-line">
              <span className="flex items-center gap-2.5 px-5 py-3 text-[14px] font-medium"><IconAgent size={16} className="text-paper" />Say this to your agent</span>
              <CopyButton text={PROMPT} label="Copy prompt" className="btn-primary border-y-0 border-r-0" />
            </div>
            <p className="px-5 py-6 font-mono text-[15px] leading-relaxed text-figure md:text-[16.5px]">{PROMPT}</p>
            <p className="border-t border-line px-5 py-3.5 text-[13px] leading-relaxed text-muted">
              It works in Claude Code, Codex, Cursor and any agent that reads the web and runs commands. To use the MCP, add it before you open
              the session: <code className="font-mono text-[12px] text-figure">claude mcp add --transport http paper-motion {site}/mcp</code>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/library" className="btn"><IconGrid size={15} />Browse the library</Link>
            <Link href="/docs" className="btn">How agents use it<IconArrow size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 px-5 pb-10 pt-16 md:px-8 md:pt-20">
          <h2 className="title max-w-[14ch]">You decide every stage.</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            A video comes together in six stages. Your agent hands you each one in the studio, a page on your machine,
            and waits. Nothing moves on until you approve it.
          </p>
        </div>
        <ol className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {STAGES.map((s, i) => (
            <li key={s.t} className="flex flex-col border-b border-r border-line px-5 pb-5 pt-4 sm:min-h-[176px] md:px-6 2xl:border-b-0">
              <span className="num text-[28px]">0{i + 1}</span>
              <h3 className="mt-auto pt-3 text-[18px] font-medium sm:pt-8">{s.t}</h3>
              <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="grid items-center gap-x-12 gap-y-8 border-t border-line px-5 py-14 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,38ch)] 2xl:border-t-0">
          <div className="border border-rule">
            <div className="border-b border-line px-4 py-2.5 text-[13px] text-muted">A board, as your agent sends it</div>
            <div className="sheet grid-cols-2 sm:grid-cols-4">
              {["mesh-graphite", "neuro-slate", "dither-slate", "grain-slate"].map((id, i) => (
                <div key={id} className={i === 2 ? "bg-paper text-ground" : ""}>
                  <div className="aspect-video overflow-hidden bg-black">
                    {(() => { const e = getResource(id)?.install.entry as { shader: string; props: Record<string, unknown>; background?: string } | undefined; return e ? <ShaderPreview entry={e} className="h-full w-full" still /> : null; })()}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 px-3 py-2">
                    <span className={`num text-[20px] ${i === 2 ? "!text-ground" : ""}`}>{"ABCD"[i]}</span>
                    <span className="truncate font-mono text-[11px] opacity-70">{id}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-line px-4 py-2.5 font-mono text-[12px] text-muted">paper-motion: C · dither-slate --set colorFront=#3d6bff</p>
          </div>
          <p className="text-[15px] leading-relaxed text-muted">
            The choices that need your eye come as boards: a link with two to four options, playing in your colors and
            type. You pick one, tune it if you like, and the choice goes back to your agent on its own.
          </p>
        </div>
      </section>

      <section className="border-b border-line px-5 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-10">
          <h2 className="title">In the library</h2>
          <Link href="/library" className="btn">All {count} resources<IconArrow size={15} /></Link>
        </div>
        <div className="sheet sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => <ResourceCard key={item.id} item={item} />)}
        </div>
      </section>

      <section>
        <ul>
          {TYPES.map((t) => {
            const n = items.filter((i) => i.type === t.type).length, Icon = TYPE_ICONS[t.type];
            return (
              <li key={t.type} className="border-b border-line last:border-b-0">
                <Link href={`/library?type=${t.type}`} className="group grid grid-cols-[20px_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-5 py-4 hover:bg-figure hover:text-ground md:grid-cols-[20px_minmax(0,300px)_minmax(0,1fr)_auto] md:px-8">
                  <Icon size={18} className="self-center text-paper group-hover:text-ground" />
                  <span className="font-serif text-[24px] leading-tight tracking-[-0.01em]">{t.title}</span>
                  <span className="text-[13.5px] text-muted group-hover:text-ground/70 max-md:col-start-2 max-md:row-start-2">{t.blurb}</span>
                  <span className="font-mono text-[13px] text-muted group-hover:text-ground/70 max-md:col-start-3 max-md:row-start-1">{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
