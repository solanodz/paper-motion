import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { IconAgent, IconArrow, IconBrand, IconGrid, IconKit, IconSpark, TYPE_ICONS } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { getIndex, TYPES } from "@/lib/registry";

const PROMPT = `Use paper-motion.app to make a launch video for my brand with my kit: npx paper-motion add sage-night instrument mesh-sage magic-move whip-pan launch. Read https://paper-motion.app/llms.txt first.`;
const FEATURED = ["magic-move", "dive-in", "whip-pan", "mesh-sage", "sage-night", "instrument"];

/** A door's little motion: what that path feels like, without words. */
function DoorArt({ kind }: { kind: "zero" | "brand" | "browse" }) {
  if (kind === "zero") {
    const sw = [["#1E201C", "#8FA67A", "#E9EDCF"], ["#0A0F1F", "#3D6BFF", "#EEF1F8"], ["#EADBC8", "#B07D73", "#2B1D19"], ["#0B0B0A", "#C8F04A", "#F4F4EE"]];
    return (
      <div className="relative h-full w-full">
        {sw.map((s, i) => (
          <div key={i} className="door-cycle absolute inset-0 flex items-end gap-1.5 p-5" style={{ animationDelay: `${i * 2}s`, background: s[0] }}>
            {s.map((c, j) => <span key={j} className="h-[46%] flex-1 rounded-sm" style={{ background: c, height: `${30 + j * 18}%` }} />)}
            <span className="absolute left-5 top-4 font-serif text-[30px] leading-none tracking-[-0.03em]" style={{ color: s[2] }}>Aa</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "brand") {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[#0e0e0e]">
        {["#E9E4D8", "#B5462E", "#5F7A86"].map((c, i) => (
          <span key={c} className="door-drop absolute h-16 w-16 rounded-full mix-blend-screen" style={{ background: c, animationDelay: `${i * -1.4}s`, left: `${30 + i * 14}%` }} />
        ))}
        <span className="relative font-mono text-[11px] text-ground mix-blend-difference">#E9E4D8 · #B5462E · #5F7A86</span>
      </div>
    );
  }
  return <video src="/previews/magic-move.webm" poster="/previews/magic-move.jpg" autoPlay muted loop playsInline className="h-full w-full object-cover" />;
}

const DOORS = [
  { href: "/start", kind: "zero" as const, icon: IconSpark, title: "Start from zero", line: "No brand yet? Answer five visual questions and get a kit made for you: palette, type, backgrounds, motion and a video structure.", cta: "Take the quiz" },
  { href: "/start/brand", kind: "brand" as const, icon: IconBrand, title: "I have a brand", line: "Bring your colors and fonts. Every preview turns into your brand, so you pick motion that already fits.", cta: "Bring my brand" },
  { href: "/library", kind: "browse" as const, icon: IconGrid, title: "I know what I want", line: "Go straight to the library: tune any resource live and drop it in your kit.", cta: "Open the library" },
];

export default function Home() {
  const { items, count } = getIndex();
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
            Pick a look, tune the motion, and hand your AI agent one prompt. It installs everything as code you own and renders
            the whole video.
          </p>

          <h2 className="mt-16 text-[15px] font-medium text-figure">Where are you starting from?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {DOORS.map((d, i) => {
              const Icon = d.icon;
              return (
                <Link key={d.href} href={d.href} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-faint">
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-line"><DoorArt kind={d.kind} /></div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-paper"><Icon size={16} /></span>
                      <span className="font-mono text-[11px] text-faint">0{i + 1}</span>
                    </div>
                    <h3 className="mt-4 font-serif text-[30px] leading-none tracking-[-0.02em]">{d.title}</h3>
                    <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted">{d.line}</p>
                    <span className="mt-5 flex items-center gap-2 text-[13.5px] font-medium text-figure">
                      {d.cta} <IconArrow size={15} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-[1fr_1.1fr] md:px-8 md:py-20">
          <div>
            <div className="flex items-center gap-2 text-paper"><IconKit size={18} /><span className="text-[14px] font-medium">Every path ends in your kit</span></div>
            <h2 className="mt-4 max-w-[16ch] font-serif text-[40px] leading-[1.02] tracking-[-0.02em] md:text-[54px]">One kit, one prompt, one video.</h2>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-muted">
              Your kit holds a palette, a font pair, backgrounds, the moves you like and a video structure, each with your settings.
              Copy it as one prompt; your agent installs it with <code className="font-mono text-[13.5px] text-figure">paper-motion add</code> and builds the piece with you.
            </p>
          </div>
          <div className="corner-marks self-center rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap gap-2">
              {[["palette", "sage-night"], ["font-pair", "instrument"], ["background", "mesh-sage"], ["component", "magic-move"], ["component", "whip-pan"], ["recipe", "launch"]].map(([t, id]) => {
                const Icon = TYPE_ICONS[t];
                return <span key={id} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-mono text-[12px] text-figure"><Icon size={13} className="text-paper" />{id}</span>;
              })}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-2 text-[13px] text-muted"><IconAgent size={15} /> For your agent</span>
              <CopyButton text={PROMPT} label="Copy" />
            </div>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-figure">{PROMPT}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-[40px] leading-none tracking-[-0.02em] md:text-[54px]">A few to start with</h2>
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
