import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLine } from "@/components/copy-button";
import { BeatsStrip } from "@/components/beats-strip";
import { Playground } from "@/components/playground/playground";
import { ResourceCard } from "@/components/resource-card";
import { getIndex, getResource, typeTitle } from "@/lib/registry";

// every resource page is prerendered from the registry; it may block on params instead of streaming a shell
export const instant = false;

export function generateStaticParams() {
  return getIndex().items.map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const r = getResource((await params).id);
  return r ? { title: r.title, description: r.summary } : {};
}

const INSTALLS: Record<string, string> = {
  code: "Copies the code to moves/ in your project, yours to edit.",
  "shader-set": "Adds the background to brand/shader-set/set.json; use it with B.shader().",
  tokens: "Merges into brand/tokens.json; keeps your own values unless you pass --force.",
  scene: "Writes a scene to pieces/, wired to your brand folder.",
};

export default async function ResourcePage({ params }: PageProps<"/r/[id]">) {
  const { id } = await params;
  const r = getResource(id);
  if (!r) notFound();
  const { items, site } = getIndex();
  const related = items
    .filter((i) => i.id !== r.id && i.type === r.type)
    .map((i) => ({ i, score: i.tags.filter((t) => r.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.i);
  const backgrounds = items.filter((i) => i.type === "background").map((i) => i.id);

  return (
    <div className="pb-24">
      <nav className="pt-8 font-mono text-[12px] text-faint">
        <Link href="/library" className="hover:text-figure">Library</Link> /{" "}
        <Link href={`/library?type=${r.type}`} className="hover:text-figure">{typeTitle(r.type)}</Link>
      </nav>

      <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-serif text-[44px] leading-none tracking-[-0.03em] md:text-[64px]">{r.title}</h1>
          <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-muted">{r.summary}</p>
        </div>
        <div className="w-full max-w-[440px] shrink-0">
          <CopyLine prefix="$" text={`npx paper-motion add ${r.id}`} />
          <p className="mt-2 text-[12.5px] leading-snug text-muted">{INSTALLS[r.install.kind]}</p>
        </div>
      </div>

      <Playground resource={r} site={site} backgrounds={backgrounds} />
      {r.beats?.length ? (
        <section className="mt-12">
          <h2 className="border-b border-line pb-3 text-[18px] font-medium">Structure</h2>
          <div className="mt-5"><BeatsStrip beats={r.beats} duration={r.duration} /></div>
        </section>
      ) : null}

      <div className="mt-16 grid gap-12 xl:grid-cols-[minmax(0,1fr)_300px]">
        {r.notes?.length ? (
          <section>
            <h2 className="border-b border-line pb-3 text-[18px] font-medium">Notes</h2>
            <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-muted">
              {r.notes.map((n) => (
                <li key={n} className="flex gap-3"><span className="mt-[9px] h-1 w-1 shrink-0 bg-faint" /><span>{n.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i} className="rounded bg-raised px-1 py-px font-mono text-[12.5px] text-figure">{part}</code> : part))}</span></li>
              ))}
            </ul>
          </section>
        ) : <div />}
        <dl className="grid h-fit grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
          <dt className="text-faint">id</dt><dd className="font-mono">{r.id}</dd>
          <dt className="text-faint">type</dt><dd>{typeTitle(r.type)}</dd>
          <dt className="text-faint">version</dt><dd className="font-mono">{r.version}</dd>
          {r.requires?.engine ? (<><dt className="text-faint">engine</dt><dd className="font-mono">{r.requires.engine}</dd></>) : null}
          <dt className="text-faint">license</dt><dd>{r.license}</dd>
          <dt className="text-faint">data</dt>
          <dd><a href={`/r/${r.id}.json`} className="font-mono underline decoration-faint underline-offset-4 hover:decoration-figure">r/{r.id}.json</a></dd>
          <dt className="text-faint">tags</dt>
          <dd className="flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <Link key={t} href={`/library?q=${encodeURIComponent(t)}`} className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted hover:text-figure">{t}</Link>
            ))}
          </dd>
        </dl>
      </div>

      {related.length ? (
        <section className="mt-20">
          <h2 className="border-b border-line pb-3 text-[18px] font-medium">Related</h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((i) => <ResourceCard key={i.id} item={i} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
