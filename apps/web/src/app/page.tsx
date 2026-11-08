import Link from "next/link";
import { CopyButton, CopyLine } from "@/components/copy-button";
import { ResourceCard } from "@/components/resource-card";
import { getIndex, TYPES } from "@/lib/registry";

const PROMPT = `Use paper-motion.app to make a video for my brand. Use the backgrounds mesh-sage and grain-slate, the effects magic-move and whip-pan, the palette sage-night and the font pair instrument. Read https://paper-motion.app/llms.txt first.`;

const FEATURED = ["magic-move", "dive-in", "whip-pan", "mesh-sage", "sage-night", "instrument"];

export default function Home() {
  const { items, count } = getIndex();
  const featured = FEATURED.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);
  return (
    <>
      <section className="grid-bg border-b border-line">
        <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-20 md:px-8 md:pb-28 md:pt-28">
          <p className="font-mono text-[13px] text-muted">{count} resources · free · MIT</p>
          <h1 className="mt-6 max-w-[14ch] font-serif text-[56px] leading-[0.95] tracking-[-0.03em] sm:text-[88px] md:text-[120px]">
            Motion your agent can use.
          </h1>
          <p className="mt-8 max-w-[56ch] text-[18px] leading-relaxed text-muted md:text-[20px]">
            Transitions, component transitions, text effects, backgrounds, palettes, fonts and recipes with names. Tell your AI
            agent which ones you want; it installs them as editable code and renders the whole video.
          </p>

          <div className="corner-marks mt-12 max-w-[860px] rounded-xl border border-line bg-surface p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-faint">Say this to your agent</span>
              <CopyButton text={PROMPT} label="Copy prompt" />
            </div>
            <p className="mt-4 font-mono text-[14px] leading-relaxed text-figure md:text-[15px]">{PROMPT}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/library" className="rounded-lg bg-figure px-5 py-3 text-[14px] font-medium text-ground transition-opacity hover:opacity-85">
              Browse the library
            </Link>
            <Link href="/docs" className="rounded-lg border border-line px-5 py-3 text-[14px] text-figure transition-colors hover:border-faint">
              How agents use it
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-[40px] leading-none tracking-[-0.02em] md:text-[56px]">A few to start with</h2>
          <Link href="/library" className="hidden font-mono text-[13px] text-muted hover:text-figure sm:block">
            All {count} →
          </Link>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <ResourceCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-px px-5 py-16 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {TYPES.map((t) => {
            const n = items.filter((i) => i.type === t.type).length;
            return (
              <Link key={t.type} href={`/library?type=${t.type}`} className="group border-t border-line py-6 pr-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-medium group-hover:text-paper">{t.title}</span>
                  <span className="font-mono text-[12px] text-faint">{n || "soon"}</span>
                </div>
                <p className="mt-2 text-[13px] leading-snug text-muted">{t.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
          <h2 className="font-serif text-[40px] leading-none tracking-[-0.02em] md:text-[56px]">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Pick by name", "Browse the library and copy the names you like, or describe the feeling and let your agent search."],
              ["Your agent installs them", "It reads llms.txt, runs paper-motion add, and the code lands in your project, yours to edit."],
              ["It renders the video", "The paper-motion engine renders frame by frame, with motion blur, to MP4."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t border-line pt-5">
                <span className="font-pixel text-[28px] text-paper">0{i + 1}</span>
                <h3 className="mt-3 text-[18px] font-medium">{t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 max-w-[620px]">
            <CopyLine prefix="$" text="npx paper-motion add magic-move mesh-sage sage-night" />
          </div>
        </div>
      </section>
    </>
  );
}
