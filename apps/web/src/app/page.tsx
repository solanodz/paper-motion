import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { IconAgent, IconArrow, IconCheck, IconGrid, TYPE_ICONS } from "@/components/icons";
import { AutoVideo } from "@/components/landing/auto-video";
import { InView, Parallax } from "@/components/landing/motion";
import { StageShow } from "@/components/landing/stage-show";
import { Rise } from "@/components/landing/text";
import { Typed } from "@/components/landing/typed";
import { Ticker } from "@/components/landing/ticker";
import { ShaderPreview } from "@/components/shader-preview";
import { starterPrompt as prompt } from "@/lib/prompt";
import { getIndex, getResource, TYPES } from "@/lib/registry";


type Entry = { shader: string; props: Record<string, unknown>; image?: string; background?: string };
type Colors = Record<string, { hex: string }>;
const shader = (id: string) => getResource(id)?.install.entry as Entry | undefined;
const clip = (id: string) => ({ src: `/previews/${id}.webm`, poster: `/previews/${id}.jpg` });

// the six stages of a piece, the same ones the studio shows
const STAGES = [
  { t: "Brief", d: "Your agent interviews you and writes what the video says, to whom and for how long. You fix any word by hand." },
  { t: "Look", d: "It proposes palettes, type, backgrounds and moves on boards. You open each one, compare them playing, and pick." },
  { t: "Structure", d: "The beats of the video, each one shown by a ready-made block from the library." },
  { t: "Parts", d: "Every part rendered in your brand. Approve it, ask for a change, or rewrite its words yourself." },
  { t: "Assembly", d: "The parts joined, with their transitions. Change a length, or drag a part to another place." },
  { t: "Final", d: "The full-quality render, in the shapes you need." },
];

const PALETTES = ["graphite", "sage-night", "cobalt", "acid-night", "clay-desert", "plum-gold", "slate-sea", "ochre-sun"];

export default function Home() {
  const { items, count, site } = getIndex();
  const PROMPT = prompt(site);
  const n = (type: string) => items.filter((i) => i.type === type).length;
  const title = (type: string) => TYPES.find((t) => t.type === type)?.title ?? type;
  const mesh = shader("mesh-graphite"), ochre = shader("warp-ochre"), clay = shader("dither-clay"), swirl = shader("swirl-paper"), metal = shader("liquid-metal"), closing = shader("dither-paper"), sage = shader("mesh-sage");
  const palettes = PALETTES.map((id) => ({ id, colors: Object.values((getResource(id)?.install.entry as { colors?: Colors } | undefined)?.colors ?? {}).map((c) => c.hex) })).filter((p) => p.colors.length);

  // what each stage looks like
  const visuals = [
    <div key="brief" className="flex h-full flex-col justify-center gap-0 bg-ground px-6 md:px-10">
      {[["What", "A 20-second launch video for the landing: the product doing its job, step by step."], ["For whom", "Small teams who still run it on a spreadsheet."], ["Format", "16:9, about 20 s"], ["Call to action", "yourproduct.com"]].map(([k, v], r) => (
        <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 border-b border-line py-3 first:border-t first:border-rule md:grid-cols-[130px_minmax(0,1fr)] md:py-4">
          <span className="text-[13px] text-muted">{k}</span>
          <span className={r === 0 ? "font-serif text-[18px] leading-snug md:text-[24px]" : "text-[14px] md:text-[15px]"}>{v}</span>
        </div>
      ))}
    </div>,
    <div key="look" className="relative h-full">
      {sage ? <ShaderPreview entry={sage} className="h-full w-full" /> : null}
      <div className="absolute inset-x-0 bottom-0 flex h-[26%] border-t border-ground">
        {(palettes.find((p) => p.id === "sage-night")?.colors ?? []).map((c) => <i key={c} className="block flex-1" style={{ background: c }} />)}
      </div>
      <span className="absolute left-5 top-4 font-serif text-[44px] leading-none text-[#E9EDCF] md:left-8 md:top-7 md:text-[72px]">Sage night</span>
    </div>,
    <div key="structure" className="sheet h-full grid-cols-3 bg-ground">
      {["word-swap", "bar-grow", "logo-build"].map((id, k) => (
        <div key={id} className="flex flex-col">
          <div className="min-h-0 flex-1"><AutoVideo {...clip(id)} /></div>
          <div className="flex items-baseline gap-2 border-t border-line px-3 py-2"><span className="num text-[16px]">0{k + 1}</span><span className="truncate font-mono text-[11px] text-muted">{id}</span></div>
        </div>
      ))}
    </div>,
    <div key="parts" className="relative h-full">
      <AutoVideo {...clip("browser-frame")} />
      <span className="tag tag-ok absolute right-3 top-3"><IconCheck size={13} />approved</span>
      <span className="absolute bottom-0 left-0 bg-ground px-3 py-2 font-mono text-[12px] text-muted"><span className="num mr-2 text-[15px]">02</span>browser-frame</span>
    </div>,
    <div key="assembly" className="flex h-full flex-col bg-ground">
      <div className="min-h-0 flex-1"><AutoVideo {...clip("product-demo")} /></div>
      <div className="flex border-t border-rule">
        {[4, 5, 4.5, 3.4, 5].map((s, k) => <div key={k} className={`border-line px-2 py-2 font-mono text-[11px] text-muted ${k ? "border-l" : ""} ${k === 1 ? "bg-paper !text-ground" : ""}`} style={{ flex: s }}>{s} s</div>)}
      </div>
    </div>,
    <div key="final" className="relative h-full">
      <AutoVideo {...clip("launch")} />
      <span className="absolute bottom-0 left-0 bg-ground px-3 py-2 font-mono text-[12px] text-muted">my-video.mp4, 1920×1080</span>
    </div>,
  ];

  // the library as a bento: every kind of resource, shown doing what it does
  let cells = 0;
  const cell = (type: string, span: string, media: React.ReactNode, extra = "") => {
    const Icon = TYPE_ICONS[type];
    return (
      <Link key={type + span} href={`/library?type=${type}`} style={{ "--i": cells++ } as React.CSSProperties} className={`wipe group relative flex flex-col overflow-hidden border border-line bg-ground hover:border-figure ${span}`}>
        <div className={`min-h-0 flex-1 ${extra}`}>{media}</div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 group-hover:bg-figure group-hover:text-ground">
          <span className="flex min-w-0 items-center gap-2 text-[14px] font-medium"><Icon size={15} className="shrink-0" /><span className="truncate">{title(type)}</span></span>
          <span className="font-mono text-[12px] text-muted group-hover:text-ground/60">{n(type)}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* a live shader from the library behind everything: the page is made of what it offers */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {mesh ? <ShaderPreview entry={mesh} className="!absolute inset-0 -z-20 opacity-60" /> : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ground/85 via-ground/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ground to-transparent" />

        <div className="grid items-center gap-x-14 gap-y-16 px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div>
            <h1 className="display rise-now max-w-[11ch]"><Rise text="Motion your agent can use." /></h1>
            <p className="settle-now mt-9 max-w-[52ch] text-[17px] leading-relaxed text-figure/75 md:text-[19px]">
              {count} moves, backgrounds, palettes, type pairs and ready-made blocks, built for AI agents. Yours proposes,
              you decide each stage in a studio, and the video renders on your machine.
            </p>
            <div className="corner-marks settle-now mt-12 max-w-[760px] border border-rule bg-ground" style={{ "--i": 1 } as React.CSSProperties}>
              <div className="flex items-stretch justify-between border-b border-line">
                <span className="flex items-center gap-2.5 px-5 py-3 text-[14px] font-medium"><IconAgent size={16} className="text-paper" />Say this to your agent</span>
                <CopyButton text={PROMPT} label="Copy prompt" className="btn-primary border-y-0 border-r-0" />
              </div>
              <p className="px-5 py-6 font-mono text-[14.5px] leading-relaxed text-figure md:text-[15.5px]"><Typed text={PROMPT} delay={1300} /></p>
            </div>
            <div className="settle-now mt-9 flex flex-wrap gap-3" style={{ "--i": 2 } as React.CSSProperties}>
              <Link href="/library" className="btn bg-ground"><IconGrid size={15} />Browse the library</Link>
              <Link href="/docs" className="btn bg-ground">How agents use it<IconArrow size={15} /></Link>
            </div>
          </div>

          {/* two real renders, one over the other. Each plays straight on a material from the library: the clip's own
              black is blended away, so the shader is its only background */}
          <Parallax className="relative pb-[18%] pr-[6%] max-xl:max-w-[760px]">
            <div className="corner-marks drift relative border border-rule" style={{ "--dx": "-10px", "--dy": "-7px" } as React.CSSProperties}>
              <div className="wipe-now relative aspect-video overflow-hidden bg-ground">
                {ochre ? <ShaderPreview entry={ochre} className="!absolute inset-0" /> : null}
                <AutoVideo {...clip("word-rise")} className="relative !bg-transparent mix-blend-screen" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-rule bg-ground px-4 py-2.5 text-[13px]"><span className="truncate"><span className="sm:hidden">word-rise on warp ochre</span><span className="max-sm:hidden">Words that rise into place, on warp ochre</span></span><span className="font-mono text-[12px] text-muted max-sm:hidden">word-rise</span></div>
            </div>
            <div className="drift absolute bottom-0 right-0 w-[54%]" style={{ "--dx": "18px", "--dy": "12px" } as React.CSSProperties}>
            <div className="float border border-paper">
              <div className="wipe-now relative aspect-video overflow-hidden bg-ground" style={{ "--i": 2 } as React.CSSProperties}>
                {clay ? <ShaderPreview entry={clay} className="!absolute inset-0" /> : null}
                <AutoVideo {...clip("magic-move")} className="relative !bg-transparent mix-blend-screen" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-rule bg-ground px-3 py-2 text-[12px]"><span className="truncate"><span className="sm:hidden">magic-move</span><span className="max-sm:hidden">One card becomes the next</span></span><span className="font-mono text-[11px] text-muted max-sm:hidden">magic-move</span></div>
            </div>
            </div>
          </Parallax>
        </div>
      </section>

      <Ticker names={["Magic move", "Whip pan", "Word rise", "Warp ochre", "Scramble", "Dive in", "Liquid metal", "Type on", "Tile swirl", "Dither clay", "Zoom through", "Bar grow"]} />

      <section className="border-b border-line">
        <InView className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 px-5 pb-14 pt-24 md:px-8 md:pb-16 md:pt-32">
          <h2 className="title max-w-[14ch]"><Rise text="You decide every stage." /></h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            A video comes together in six stages. Your agent hands you each one in the studio, a page on your machine,
            and waits. Nothing moves on until you approve it.
          </p>
        </InView>
        <StageShow stages={STAGES} visuals={visuals} />
      </section>

      {/* paper: the board, the one place where you choose with your eyes */}
      <section className="border-b border-line bg-paper text-ground">
        <InView className="grid items-center gap-x-16 gap-y-12 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div>
            <h2 className="title max-w-[12ch]"><Rise text="Choose with your eyes." /></h2>
            <p className="mt-8 max-w-[40ch] text-[16px] leading-relaxed text-ground/70">
              What needs your eye comes as a board: a link with two to four options, playing in your colors and type.
              Pick one, tune it if you like, and the choice goes back to your agent on its own.
            </p>
          </div>
          <div className="border border-ground bg-ground text-figure">
            <div className="border-b border-line px-4 py-2.5 text-[13px] text-muted">Backgrounds for your brand</div>
            <div className="sheet grid-cols-2 sm:grid-cols-4">
              {["mesh-graphite", "neuro-slate", "swirl-paper", "grain-slate"].map((id, i) => {
                const e = shader(id);
                return (
                  <div key={id} className={i === 2 ? "bg-paper text-ground" : ""}>
                    <div className="aspect-video overflow-hidden bg-black">{e ? <ShaderPreview entry={e} className="h-full w-full" /> : null}</div>
                    <div className="flex items-baseline justify-between gap-2 px-3 py-2">
                      <span className={`num text-[20px] ${i === 2 ? "!text-ground" : ""}`}>{"ABCD"[i]}</span>
                      <span className="truncate font-mono text-[11px] opacity-70">{id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="border-t border-line px-4 py-2.5 font-mono text-[12px] text-muted">paper-motion: C · swirl-paper --set speed=0.6</p>
          </div>
        </InView>
      </section>

      <section className="border-b border-line px-5 pb-24 pt-24 md:px-8 md:pb-32 md:pt-32">
        <InView className="flex flex-wrap items-end justify-between gap-6 pb-14 md:pb-16">
          <h2 className="title"><Rise text="In the library" /></h2>
          <Link href="/library" className="btn">All {count} resources<IconArrow size={15} /></Link>
        </InView>
        <InView className="grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:gap-4 lg:grid-cols-4 xl:auto-rows-[270px]">
          {cell("recipe", "col-span-2 row-span-2", <AutoVideo {...clip("product-demo")} />)}
          {cell("background", "", swirl ? <ShaderPreview entry={swirl} className="h-full w-full" /> : null)}
          {cell("block", "", <AutoVideo {...clip("terminal-run")} />)}
          {cell("component", "", <AutoVideo {...clip("tile-swirl")} />)}
          {cell("transition", "", <AutoVideo {...clip("slices")} />)}
          {cell("palette", "col-span-2", <div className="flex h-full flex-col">{palettes.map((p) => <div key={p.id} className="flex min-h-0 flex-1">{p.colors.map((c, k) => <i key={k} className="block" style={{ background: c, flex: [5, 2, 1.5, 2, 3][k] ?? 1 }} />)}</div>)}</div>)}
          {cell("font-pair", "", <div className="flex h-full items-end justify-between bg-paper px-4 pb-2 text-ground"><span className="font-serif text-[96px] leading-[0.8] tracking-[-0.04em] xl:text-[132px]">Aa</span><span className="pb-2 font-mono text-[11px]">Geist Serif</span></div>)}
          {cell("text", "", <AutoVideo {...clip("scramble")} />)}
          {cell("camera", "", <AutoVideo {...clip("orbit")} />)}
          {cell("shot", "", <AutoVideo {...clip("focus-pull")} />)}
          <Link href="/r/liquid-metal" style={{ "--i": cells } as React.CSSProperties} className="wipe group relative col-span-2 flex flex-col overflow-hidden border border-line bg-ground hover:border-figure">
            <div className="min-h-0 flex-1">{metal ? <ShaderPreview entry={metal} className="h-full w-full" /> : null}</div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 group-hover:bg-figure group-hover:text-ground">
              <span className="text-[14px] font-medium">Your wordmark, as liquid metal</span>
              <span className="font-mono text-[12px] text-muted group-hover:text-ground/60">liquid-metal</span>
            </div>
          </Link>
        </InView>
      </section>

      {/* the way out is the way in: the same sentence, on paper */}
      <section className="relative isolate overflow-hidden bg-paper text-ground">
        {closing ? <ShaderPreview entry={closing} className="!absolute inset-0 -z-10 opacity-40 lg:opacity-90" /> : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-paper from-30% via-paper/70 via-55% to-transparent" />
        <InView className="px-5 py-28 md:px-8 md:py-40">
          <h2 className="display max-w-[10ch]"><Rise text="One sentence starts it." /></h2>
          <p className="mt-10 max-w-[62ch] font-mono text-[15px] leading-relaxed md:text-[17px]">{PROMPT}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <CopyButton text={PROMPT} label="Copy prompt" className="!border-ground !bg-ground !px-5 !py-3 !text-[14px] !text-figure hover:!bg-figure hover:!text-ground" />
            <span className="max-w-[44ch] text-[13px] text-ground/70">Paste it in Claude Code, Codex, Cursor or any agent that reads the web and runs commands.</span>
          </div>
        </InView>
      </section>
    </>
  );
}
