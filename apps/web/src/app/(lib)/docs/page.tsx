import type { Metadata } from "next";
import { CopyLine } from "@/components/copy-button";
import { IconAgent, IconCheck, IconKit } from "@/components/icons";
import { getIndex, TYPES } from "@/lib/registry";

export const metadata: Metadata = { title: "For agents" };

const BOARD_CMD = `npx paper-motion board --url --title "Backgrounds for Kiln" --ask "Which one feels like the product?" --reply bg-1 --look cobalt,geist --option mesh-graphite --note "quiet, graphite" --option neuro-slate --note "a technical web" --option "dither-slate:colorFront=#3d6bff" --note "pixels in your accent" --option grain-slate`;

const STEPS: [string, string, string?][] = [
  ["The user starts", "They paste the home page's prompt in their agent. The agent installs the skills and reads llms.txt.", "npx skills add solanodz/paper-motion"],
  ["Interview", "The make-video skill asks what the brand is, what the video is for, the format and the feel. It reads the brand folder when there is one."],
  ["Search", "The agent filters the registry by the metadata: mode, colors near the brand's, mood, energy, role.", `npx paper-motion search --type background --mode dark --near "#0a0f1f,#3d6bff"`],
  ["Propose a board", "Two to four options in one link. The user opens it and sees them live, in their own look: backgrounds come recolored into their palette.", BOARD_CMD],
  ["Read the reply", "The user pastes one line back. It names the option and carries any tuning as --set arguments.", "paper-motion: C · dither-slate --set speed=1.5 --set colorFront=#3d6bff (bg-1)"],
  ["Install and build", "The agent installs the choice as code the user owns, then builds, checks stills and renders.", "npx paper-motion add dither-slate --set speed=1.5 --set colorFront=#3d6bff"],
];

const META: [string, string][] = [
  ["when", "two or three “use it when…” phrases, on every resource"],
  ["mood", "calm, bold, playful, technical, editorial, warm, minimal, luxury, raw"],
  ["energy · role", "moves: 1 (still) to 5 (violent); enter, exit, swap, emphasis, camera, text"],
  ["colors · mode", "backgrounds and palettes: dominant hex colors; light or dark"],
  ["motion", "backgrounds: still, gentle, lively"],
  ["voice", "font pairs: serif, sans, display, mono"],
  ["duration · formats", "recipes: seconds; 16:9, 9:16, 1:1, 4:5"],
];

export default function DocsPage() {
  const { site, count, items } = getIndex();
  const endpoints: [string, string][] = [
    ["/llms.txt", "the flow, the metadata, the board link format, and every resource in one line"],
    ["/llms-full.txt", "the full catalog in text: params, notes and usage for each resource"],
    ["/registry.json", "the index: id, type, title, summary, tags and the metadata of each resource"],
    ["/r/<id>.json", "one resource: params with ranges, install instructions, usage and the file contents"],
    ["/b#<payload>", "a board; the payload is base64url(deflate-raw(JSON)) and never reaches the server"],
    ["/schema.json", "the JSON Schema every resource follows"],
  ];
  return (
    <div className="max-w-[920px] pb-24">
      <div className="pb-10 pt-14">
        <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] md:text-[80px]">For agents</h1>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-muted">
          paper-motion.app is built to be driven by an AI agent. The agent reads the registry, proposes options as a <b className="text-figure">board</b> link,
          the user chooses in the browser, and the agent installs and renders. {count} resources so far.
        </p>
      </div>

      <section>
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">The flow</h2>
        <ol className="mt-2">
          {STEPS.map(([t, d, cmd], i) => (
            <li key={t} className="grid gap-4 border-b border-line py-6 md:grid-cols-[60px_1fr]">
              <span className="font-pixel text-[26px] text-paper">0{i + 1}</span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-medium">{t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
                {cmd ? <div className="mt-3"><CopyLine prefix={cmd.startsWith("paper-motion:") ? undefined : "$"} text={cmd} /></div> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">What the user does on a board</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [IconCheck, "Choose", "Picks an option as proposed. The reply names it: “A · mesh-graphite”."],
            [IconKit, "Tune, then choose", "Opens the option in the playground, adjusts it, chooses. The reply carries the --set arguments."],
            [IconAgent, "None of these", "Tells the agent what they would rather see. The reply starts with “none of”."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof IconCheck;
            return (
              <div key={t as string} className="rounded-lg border border-line bg-surface p-4">
                <I size={16} className="text-paper" />
                <div className="mt-3 text-[15px] font-medium">{t as string}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{d as string}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[13.5px] text-muted">Every choice also lands in the user&apos;s kit, whose prompt carries the whole <code className="font-mono text-figure">paper-motion add</code> command.</p>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">Metadata to choose with</h2>
        <div className="mt-2 divide-y divide-line">
          {META.map(([k, d]) => (
            <div key={k} className="grid gap-1 py-3.5 md:grid-cols-[180px_1fr]">
              <code className="font-mono text-[13px] text-figure">{k}</code>
              <span className="text-[14px] text-muted">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">Endpoints</h2>
        <div className="mt-2 divide-y divide-line">
          {endpoints.map(([p, d]) => (
            <div key={p} className="grid gap-1 py-4 md:grid-cols-[200px_1fr]">
              {p.includes("<") ? <code className="font-mono text-[13px] text-figure">{p}</code> : (
                <a href={p} className="font-mono text-[13px] text-figure underline decoration-faint underline-offset-4 hover:decoration-figure">{p}</a>
              )}
              <span className="text-[14px] text-muted">{d}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[12px] text-faint">Base URL: {site}</p>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">What gets installed where</h2>
        <div className="mt-2 divide-y divide-line">
          {TYPES.map((t) => (
            <div key={t.type} className="grid gap-1 py-4 md:grid-cols-[200px_1fr_60px]">
              <span className="text-[14px]">{t.title}</span>
              <span className="text-[14px] text-muted">{t.blurb}</span>
              <span className="font-mono text-[12px] text-faint md:text-right">{items.filter((i) => i.type === t.type).length || "soon"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
