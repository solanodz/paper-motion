import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { IconArrow, IconChevron } from "@/components/icons";
import { PromptEditor } from "@/components/prompt-editor";
import { getDirector, getEntries, getEntry, runsLabel } from "@/lib/gallery";

export function generateStaticParams() {
  return getEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getEntry((await params).slug);
  if (!e) return {};
  return {
    title: e.title,
    description: e.summary,
    openGraph: e.media.poster ? { images: [e.media.poster] } : undefined,
  };
}

const ASPECT = { "16:9": "aspect-video", "9:16": "aspect-[9/16] max-h-[78vh]", "1:1": "aspect-square max-h-[78vh]" } as const;

function Section({ title, count, children, open = false }: { title: string; count?: number; children: React.ReactNode; open?: boolean }) {
  return (
    <Collapsible defaultOpen={open} className="border-b border-line">
      <CollapsibleTrigger className="collapsible-trigger">
        <span className="font-serif text-[24px] tracking-[-0.02em]">{title}</span>
        <span className="flex items-center gap-3">
          {count !== undefined ? <span className="font-mono text-[12px] text-faint">{count}</span> : null}
          <IconChevron size={16} className="chev" />
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel className="collapsible-panel">
        <div className="px-5 pb-8 md:px-8">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entries = getEntries();
  const i = entries.findIndex((e) => e.slug === slug);
  const e = entries[i];
  if (!e) notFound();
  const prev = entries[(i - 1 + entries.length) % entries.length];
  const next = entries[(i + 1) % entries.length];

  const facts: [string, React.ReactNode][] = [
    ["Format", <span key="f" className="font-mono">{e.format} · {e.duration} s</span>],
    ["Made by", `${e.runs.agent} with ${e.runs.model}`],
    ["Cold runs", <span key="r"><span className={e.runs.tried ? "tag tag-ok" : "tag tag-warn"}>{runsLabel(e)}</span>{e.runs.note ? <span className="mt-2 block text-muted">{e.runs.note}</span> : null}</span>],
    ["Date", <span key="d" className="font-mono">{e.runs.date}</span>],
  ];
  if (e.runs.minutes) facts.push(["Time", `About ${e.runs.minutes} minutes, start to mp4`]);

  return (
    <article>
      <nav className="flex h-11 items-stretch justify-between border-b border-line text-[13px]">
        <Link href="/" className="flex items-center gap-2 px-5 text-muted hover:text-figure md:px-8">
          <IconArrow size={14} className="rotate-180" />
          Gallery
        </Link>
        {entries.length > 1 ? (
          <div className="cells [&>*]:h-full">
            <Link href={`/v/${prev.slug}`} className="cell">Previous</Link>
            <Link href={`/v/${next.slug}`} className="cell">Next</Link>
          </div>
        ) : null}
      </nav>

      <section className="grid border-b border-line lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="flex items-center justify-center bg-black lg:border-r lg:border-line">
          {e.media.video ? (
            <video
              src={e.media.video}
              poster={e.media.poster}
              controls
              playsInline
              autoPlay
              muted
              loop
              className={`w-full ${ASPECT[e.format]} object-contain`}
            />
          ) : (
            <div className={`grid-bg grid w-full place-items-center ${ASPECT[e.format]}`}>
              <span className="font-mono text-[12px] text-faint">render pending</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="border-b border-line px-5 py-8 md:px-8">
            {e.draft ? <span className="tag tag-warn mb-4">draft · not published</span> : null}
            <h1 className="title">{e.title}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{e.summary}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {e.techniques.map((t) => (
                <li key={t} className="tag">{t}</li>
              ))}
            </ul>
          </div>
          <dl className="px-5 md:px-8">
            {facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-line py-3.5 text-[14px] last:border-b-0">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <PromptEditor slug={e.slug} template={e.prompt} variables={e.variables} director={getDirector()} />

      {e.alsoMade.map((a) => (
        <section key={a.name} className="grid border-b border-line lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="flex items-center justify-center bg-black lg:border-r lg:border-line">
            {a.video ? (
              <video src={a.video} poster={a.poster} controls playsInline preload="metadata" className={`w-full ${ASPECT[e.format]} object-contain`} />
            ) : null}
          </div>
          <div className="flex flex-col">
            <div className="border-b border-line px-5 py-8 md:px-8">
              <span className="tag tag-ok mb-4">same prompt · other values</span>
              <h2 className="font-serif text-[28px] tracking-[-0.02em]">{a.title}</h2>
              {a.note ? <p className="mt-3 text-[15px] leading-relaxed text-muted">{a.note}</p> : null}
            </div>
            <dl className="px-5 md:px-8">
              {e.variables
                .filter((v) => a.values[v.key])
                .map((v) => (
                  <div key={v.key} className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-line py-3.5 text-[14px] last:border-b-0">
                    <dt className="text-muted">{v.label.replace(/ \(.*\)$/, "")}</dt>
                    <dd>{a.values[v.key]}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </section>
      ))}

      <div className="mt-px">
        <Section title="What to bring" count={e.bring.length} open>
          <ul className="flex max-w-[70ch] flex-col gap-2 text-[15px] leading-relaxed">
            {e.bring.map((b) => (
              <li key={b} className="flex gap-3"><span className="text-faint">–</span>{b}</li>
            ))}
          </ul>
        </Section>
        <Section title="When it goes wrong" count={e.failures.length}>
          <dl className="grid max-w-[80ch] gap-5">
            {e.failures.map((f) => (
              <div key={f.title}>
                <dt className="text-[15px] font-medium">{f.title}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-muted">{f.body}</dd>
              </div>
            ))}
          </dl>
        </Section>
        {e.media.contact ? (
          <Section title="The contact sheet it was judged on">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.media.contact} alt={`Contact sheet for ${e.title}`} className="w-full max-w-[900px] border border-line" loading="lazy" />
          </Section>
        ) : null}
        {e.credits.length ? (
          <Section title="Credits" count={e.credits.length}>
            <ul className="grid max-w-[80ch] gap-2 text-[14px]">
              {e.credits.map((c) => (
                <li key={c.asset} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-line pb-2">
                  <span>{c.asset} · <span className="text-muted">{c.by}</span></span>
                  <span className="font-mono text-[12px] text-muted">{c.license}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {e.notes ? (
          <Section title="Notes">
            <p className="max-w-[70ch] text-[15px] leading-relaxed text-muted">{e.notes}</p>
          </Section>
        ) : null}
      </div>
    </article>
  );
}
