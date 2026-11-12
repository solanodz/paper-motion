"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconSearch } from "./icons";

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
    <div className="sticky top-[52px] z-30 -mx-5 border-y border-line bg-ground md:-mx-10">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="cells min-w-0 flex-1 overflow-x-auto text-[12.5px] [&>*:first-child]:border-l-0">
          {[{ type: "all", short: "All", count: items.length }, ...tabs].map((t) => (
            <button key={t.type} type="button" aria-pressed={type === t.type} onClick={() => setType(t.type)} className={`cell h-11 shrink-0 px-3.5 ${type === t.type ? "cell-on" : ""}`}>
              {t.short} <span className="font-mono text-[11px] opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <label className="flex h-11 shrink-0 items-center gap-2.5 border-line px-5 focus-within:bg-surface max-lg:border-t lg:w-[340px] lg:border-l">
          <IconSearch size={15} className="shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: spring, dark, 3d, editorial" aria-label="Search the library" className="w-full bg-transparent font-mono text-[13px] text-figure outline-none placeholder:text-faint" />
          <span className="shrink-0 font-mono text-[12px] text-muted">{shown.size}</span>
        </label>
      </div>
    </div>
  );
}
