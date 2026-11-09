"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Meta = { id: string; type: string; text: string };
type TypeTab = { type: string; short: string; count: number };

/** Type tabs and a search box that show or hide the server-rendered cards (each card has data-id). */
export function LibraryControls({ items, tabs }: { items: Meta[]; tabs: TypeTab[] }) {
  const params = useSearchParams();
  const [type, setType] = useState(params.get("type") ?? "all");
  const [q, setQ] = useState(params.get("q") ?? "");

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return new Set(items.filter((i) => (type === "all" || i.type === type) && words.every((w) => i.text.includes(w))).map((i) => i.id));
  }, [items, type, q]);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => {
      el.hidden = !shown.has(el.dataset.card!);
    });
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
      el.hidden = !el.querySelector("[data-card]:not([hidden])");
    });
    const url = new URL(window.location.href);
    if (type === "all") url.searchParams.delete("type");
    else url.searchParams.set("type", type);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [shown, type, q]);

  return (
    <div className="sticky top-14 z-30 border-b border-line bg-ground/90 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto lg:flex-wrap lg:overflow-visible">
          {[{ type: "all", short: "All", count: items.length }, ...tabs].map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(t.type)}
              className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-[12.5px] transition-colors ${
                type === t.type ? "bg-figure text-ground" : "text-muted hover:bg-raised hover:text-figure"
              }`}
            >
              {t.short} <span className={type === t.type ? "text-ground/50" : "text-faint"}>{t.count}</span>
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: spring, dark, 3d, editorial…"
          className="w-full shrink-0 rounded-md border border-line bg-surface px-3 py-2 font-mono text-[13px] text-figure outline-none placeholder:text-faint focus:border-faint lg:w-[300px]"
        />
      </div>
      <p className="mt-3 font-mono text-[12px] text-faint">{shown.size} shown</p>
    </div>
  );
}
