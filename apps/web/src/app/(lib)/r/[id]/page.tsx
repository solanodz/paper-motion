import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLine } from "@/components/copy-button";
import { BeatsStrip } from "@/components/beats-strip";
import { ScriptPlayer } from "@/components/script-player";
import { Playground } from "@/components/playground/playground";
import { ResourceCard } from "@/components/resource-card";
import { IconArrow, IconFile, TYPE_ICONS } from "@/components/icons";
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

const tagLink = "tag hover:border-figure hover:bg-figure hover:text-ground";
// a spec row in a column that may be half the page: a narrower label than `.row` gives (it still stacks on a phone)
const specRow = "row py-3.5 sm:grid-cols-[120px_minmax(0,1fr)]";

/** A resource, as a spec sheet: what it is, how to install it, the live stage and its parameters, then the facts. */
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
  const TypeIcon = TYPE_ICONS[r.type];
  // "Halftone Dots · sage, soft squares": the name in display type, its variant on a line of its own under it
  const [name, ...rest] = r.title.split(" · ");
  const variant = rest.join(", ");

  return (
    <div className="pb-28">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pt-6">
        <Link href="/library" className="btn btn-sm"><IconArrow size={13} className="rotate-180" />Library</Link>
        <Link href={`/library?type=${r.type}`} className={tagLink}><TypeIcon size={13} />{typeTitle(r.type)}</Link>
      </nav>

      <header className="pb-9 pt-10 md:pt-14">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <h1 className={`display min-w-0 [overflow-wrap:anywhere] ${name.length > 16 ? "text-[length:clamp(40px,5.6vw,84px)]" : ""}`}>
            {name}
            {variant ? <span className="mt-[0.2em] block text-[0.42em] leading-[1.08] tracking-[-0.02em] text-muted">{variant}</span> : null}
          </h1>
          <code className="font-mono text-[13px] text-muted">{r.id}</code>
        </div>
        <p className="mt-6 max-w-[62ch] text-[16px] leading-relaxed text-muted">{r.summary}</p>
      </header>

      <div className="rows text-[14px]">
        <div className="row">
          <div className="sm:pt-[11px]">Install</div>
          <div className="min-w-0">
            <div className="max-w-[560px]"><CopyLine prefix="$" text={`npx paper-motion add ${r.id}`} /></div>
            <p className="mt-2.5 text-[13px] leading-snug text-muted">{INSTALLS[r.install.kind]}</p>
          </div>
        </div>
      </div>

      <Playground resource={r} site={site} backgrounds={backgrounds} />

      {r.beats?.length ? (
        <section className="mt-24">
          <h2 className="title">Structure</h2>
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative aspect-video overflow-hidden border border-line bg-black"><ScriptPlayer beats={r.beats} duration={r.duration} title={r.title} /></div>
            <BeatsStrip beats={r.beats} duration={r.duration} />
          </div>
          <p className="mt-5 max-w-[72ch] text-[13px] leading-snug text-muted">The script, sketched: the beats in order and their length, in the brand&apos;s colors and type. The clip above is the engine&apos;s render of the same recipe.</p>
        </section>
      ) : null}

      <div className={`mt-24 grid gap-x-12 gap-y-24 ${r.notes?.length ? "xl:grid-cols-2" : ""}`}>
        {r.notes?.length ? (
          <section className="min-w-0">
            <h2 className="title">Notes</h2>
            <ul className="mt-7 border-t border-rule text-[15px] leading-relaxed text-muted">
              {r.notes.map((n) => (
                <li key={n} className="border-b border-line py-3.5">{n.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i} className="border border-line bg-surface px-1 py-px font-mono text-[13px] text-figure">{part}</code> : part))}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="min-w-0">
          <h2 className="title">Spec</h2>
          <dl className="rows mt-7 text-[14px]">
            <div className={specRow}><dt>Id</dt><dd className="font-mono text-[13px]">{r.id}</dd></div>
            <div className={specRow}><dt>Type</dt><dd><span className="tag"><TypeIcon size={13} />{typeTitle(r.type)}</span></dd></div>
            <div className={specRow}><dt>Version</dt><dd className="font-mono text-[13px]">{r.version}</dd></div>
            {r.requires?.engine ? (<div className={specRow}><dt>Engine</dt><dd className="font-mono text-[13px]">{r.requires.engine}</dd></div>) : null}
            <div className={specRow}><dt>License</dt><dd>{r.license}</dd></div>
            <div className={specRow}>
              <dt>Data</dt>
              <dd><a href={`/r/${r.id}.json`} className="btn btn-sm max-w-full font-mono"><IconFile size={13} /><span className="min-w-0 truncate">r/{r.id}.json</span></a></dd>
            </div>
            <div className={specRow}>
              <dt>Tags</dt>
              <dd className="flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <Link key={t} href={`/library?q=${encodeURIComponent(t)}`} className={tagLink}>{t}</Link>
                ))}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {related.length ? (
        <section className="mt-24">
          <h2 className="title">Related</h2>
          <div className="sheet mt-7 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((i) => <div key={i.id}><ResourceCard item={i} /></div>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
