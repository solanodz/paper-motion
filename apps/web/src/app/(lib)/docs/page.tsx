import type { Metadata } from "next";
import { CopyLine } from "@/components/copy-button";
import { getIndex, TYPES } from "@/lib/registry";

export const metadata: Metadata = { title: "For agents" };

const STEPS: [string, string, string?][] = [
  ["Set up", "Install the skills and the engine. The engine needs Node 18+, ffmpeg and Chrome.", "npx skills add solanodz/paper-motion"],
  ["Pick resources by name", "The user names them, or the agent searches the index by feeling (dark, spring, editorial…).", "npx paper-motion search spring"],
  ["Install them", "Moves land in moves/, backgrounds in brand/shader-set/set.json, palettes and fonts in brand/tokens.json, recipes in pieces/.", "npx paper-motion add magic-move mesh-sage sage-night instrument"],
  ["Adapt them", "Every resource lists its params. Change them in the call, in set.json or in tokens.json; the copied code is yours."],
  ["Render", "Build scene.html as a pure function of time, check stills, then render with motion blur.", "npx paper-motion render scene.html --motion-blur 5"],
];

export default function DocsPage() {
  const { site, count, items } = getIndex();
  const endpoints = [
    ["/llms.txt", "what the site is, the flow, and every resource with a one-line summary"],
    ["/llms-full.txt", "the full catalog in text: params, notes and usage for each resource"],
    ["/registry.json", "the index: id, type, title, summary, tags and the URL of each resource"],
    ["/r/<id>.json", "one resource: params, install instructions, usage and the file contents"],
    ["/schema.json", "the JSON Schema every resource follows"],
  ];
  return (
    <div className="max-w-[900px] pb-24">
      <div className="pb-10 pt-14">
        <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] md:text-[80px]">For agents</h1>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-muted">
          paper-motion is built to be read by AI agents. A user says &ldquo;use paper-motion.app with these backgrounds and these
          effects&rdquo;; the agent reads <code className="font-mono text-figure">llms.txt</code>, installs the resources and renders
          the video. {count} resources so far, and more on the way.
        </p>
      </div>

      <section>
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">The flow</h2>
        <ol className="mt-2">
          {STEPS.map(([t, d, cmd], i) => (
            <li key={t} className="grid gap-4 border-b border-line py-6 md:grid-cols-[60px_1fr]">
              <span className="font-pixel text-[26px] text-paper">0{i + 1}</span>
              <div>
                <h3 className="text-[17px] font-medium">{t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
                {cmd ? (
                  <div className="mt-3 max-w-[640px]">
                    <CopyLine prefix="$" text={cmd} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="border-b border-line pb-3 text-[20px] font-medium">Endpoints</h2>
        <div className="mt-2 divide-y divide-line">
          {endpoints.map(([p, d]) => (
            <div key={p} className="grid gap-1 py-4 md:grid-cols-[200px_1fr]">
              {p.includes("<") ? (
                <code className="font-mono text-[13px] text-figure">{p}</code>
              ) : (
                <a href={p} className="font-mono text-[13px] text-figure underline decoration-faint underline-offset-4 hover:decoration-figure">
                  {p}
                </a>
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
