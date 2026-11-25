"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control";
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle";
import { AutoVideo } from "./auto-video";
import { IconArrow } from "./icons";

export type Card = {
  slug: string;
  title: string;
  summary: string;
  format: "16:9" | "9:16" | "1:1";
  duration: number;
  techniques: string[];
  draft: boolean;
  runs: string;
  video?: string;
  poster?: string;
};

// a 16:9 card spans two columns; a vertical or square one takes one column at the same height, framed in black
const SPAN: Record<Card["format"], string> = {
  "16:9": "md:col-span-2",
  "9:16": "md:col-span-1",
  "1:1": "md:col-span-1",
};
const MEDIA: Record<Card["format"], string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16] md:aspect-[8/9]",
  "1:1": "aspect-square md:aspect-[8/9]",
};

export function GalleryGrid({ cards }: { cards: Card[] }) {
  const formats = useMemo(() => [...new Set(cards.map((c) => c.format))], [cards]);
  const techniques = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of cards) for (const t of c.techniques) count.set(t, (count.get(t) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [cards]);

  const [format, setFormat] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);

  const shown = cards.filter(
    (c) => (format === "all" || c.format === format) && picked.every((t) => c.techniques.includes(t)),
  );

  return (
    <div>
      <div className="flex flex-col border-b border-line md:flex-row md:items-stretch">
        <SegmentedControl
          aria-label="Format"
          value={format}
          onValueChange={(v) => setFormat(v ?? "all")}
          className="segmented shrink-0 border-b border-line md:border-b-0 md:border-r"
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          {formats.map((f) => (
            <SegmentedControlItem key={f} value={f} className="font-mono text-[12px]">
              {f}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <ToggleGroup
          multiple
          aria-label="Techniques"
          value={picked}
          onValueChange={setPicked}
          className="flex min-w-0 flex-1 gap-0 overflow-x-auto"
        >
          {techniques.map((t) => (
            <Toggle key={t} value={t} className="chip">
              {t}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>

      {shown.length ? (
        <ul className="grid grid-cols-1 gap-px bg-line md:grid-cols-4">
          {shown.map((c) => (
            <li key={c.slug} className={`bg-ground ${SPAN[c.format]}`}>
              <Link href={`/v/${c.slug}`} className="card group block">
                <div className={`relative overflow-hidden bg-black ${MEDIA[c.format]}`}>
                  {c.video ? (
                    <AutoVideo
                      src={c.video}
                      poster={c.poster}
                      label={c.title}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  ) : (
                    <div className="grid-bg absolute inset-0 grid place-items-center">
                      <span className="font-mono text-[12px] text-faint">render pending</span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="tag bg-ground">{c.format}</span>
                    {c.draft ? <span className="tag tag-warn">draft</span> : null}
                  </div>
                </div>
                <div className="flex flex-col gap-4 border-t border-line p-4 md:p-5">
                  <div className="min-w-0">
                    <h2 className="font-serif text-[26px] leading-none tracking-[-0.02em]">{c.title}</h2>
                    <p className="mt-2 max-w-[52ch] text-[14px] leading-snug text-muted">{c.summary}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[12px] text-faint">
                      {c.duration} s · {c.runs}
                    </p>
                    <span className="card-go btn btn-sm shrink-0" aria-hidden>
                      Prompt
                      <IconArrow size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-20 text-center md:px-8">
          <p className="text-muted">No video has all of those yet.</p>
          <button type="button" className="btn btn-sm mt-4" onClick={() => { setFormat("all"); setPicked([]); }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
