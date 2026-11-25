import { GalleryGrid, type Card } from "@/components/gallery-grid";
import { SearchPalette } from "@/components/search-palette";
import { getEntries, runsLabel } from "@/lib/gallery";

export default function Home() {
  const entries = getEntries();
  const cards: Card[] = entries.map((e) => ({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    format: e.format,
    duration: e.duration,
    techniques: e.techniques,
    draft: e.draft,
    runs: runsLabel(e),
    video: e.media.video,
    poster: e.media.poster,
  }));
  const latest = entries.find((e) => !e.draft) ?? entries[0];

  return (
    <>
      <section className="grid border-b border-line md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between gap-10 px-5 pb-10 pt-14 md:px-8 md:pb-12 md:pt-20">
          <div>
            <h1 className="display max-w-[11ch]">Videos your agent can make.</h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
              Each video comes with the exact prompt that made it, tested in a fresh session. Pick one, make it yours,
              and paste it into Claude Code, Codex, Cursor or any agent that can run code.
            </p>
          </div>
          <ol className="grid border border-line text-[13px] sm:grid-cols-3">
            {["Pick a video", "Make the prompt yours", "Paste it into your agent"].map((s, i) => (
              <li key={s} className="flex h-11 items-center gap-3 border-line px-4 text-figure [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0">
                <span className="num text-[15px]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        {latest ? (
          <div className="relative hidden overflow-hidden border-l border-line bg-surface md:block" aria-hidden>
            <pre className="prompt-fade absolute inset-0 overflow-hidden whitespace-pre p-8 font-mono text-[12.5px] leading-[1.7] text-muted">
              {latest.prompt}
            </pre>
            <span className="tag tag-paper absolute right-6 top-6">{latest.title} · the prompt</span>
          </div>
        ) : null}
      </section>

      <div className="flex h-12 items-stretch justify-between border-b border-line">
        <p className="flex items-center px-5 font-mono text-[12px] text-faint md:px-8">
          {entries.length} {entries.length === 1 ? "video" : "videos"}
        </p>
        <SearchPalette
          items={entries.map((e) => ({ slug: e.slug, title: e.title, summary: e.summary, format: e.format, techniques: e.techniques }))}
        />
      </div>

      <GalleryGrid cards={cards} />
    </>
  );
}
