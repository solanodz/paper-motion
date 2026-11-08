"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Item = { id: string; title: string };
type Section = { type: string; title: string; items: Item[] };

const START = [
  { href: "/docs", label: "Introduction" },
  { href: "/library", label: "All resources" },
  { href: "/llms.txt", label: "llms.txt" },
];

/** The library's left menu: getting-started links, then every resource grouped by type. */
export function Sidebar({ sections }: { sections: Section[] }) {
  const path = usePathname();
  const current = path.startsWith("/r/") ? path.slice(3) : null;
  const currentType = sections.find((s) => s.items.some((i) => i.id === current))?.type;
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false); // mobile drawer

  useEffect(() => setOpen(false), [path]);

  const filtered = useMemo(() => {
    const w = q.toLowerCase().trim();
    return sections.map((s) => ({ ...s, items: w ? s.items.filter((i) => `${i.id} ${i.title}`.toLowerCase().includes(w)) : s.items })).filter((s) => s.items.length);
  }, [sections, q]);

  const nav = (
    <nav className="flex flex-col gap-6 pb-10 text-[13.5px]">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter…"
        className="w-full rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-[12.5px] text-figure outline-none placeholder:text-faint focus:border-faint"
      />
      {!q && (
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-faint">Getting started</div>
          <ul className="flex flex-col">
            {START.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`block rounded-md px-2 py-1 transition-colors ${path === l.href ? "bg-raised text-figure" : "text-muted hover:text-figure"}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {filtered.map((s) => {
        const isClosed = q ? false : (closed[s.type] ?? false);
        return (
          <div key={s.type}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [s.type]: !isClosed }))}
              className="mb-1 flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-faint hover:text-muted"
            >
              <span className={s.type === currentType ? "text-paper" : ""}>{s.title}</span>
              <span>{isClosed ? "+" : "–"}</span>
            </button>
            {!isClosed && (
              <ul className="flex flex-col border-l border-line">
                {s.items.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/r/${i.id}`}
                      className={`-ml-px block border-l py-[3px] pl-3 transition-colors ${
                        i.id === current ? "border-figure text-figure" : "border-transparent text-muted hover:border-faint hover:text-figure"
                      }`}
                    >
                      {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-line bg-raised px-4 py-2 font-mono text-[12px] text-figure shadow-lg lg:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-ground px-5 pt-6 lg:hidden">{nav}</div>
      )}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[250px] shrink-0 overflow-y-auto border-r border-line py-8 pr-5 lg:block">{nav}</aside>
    </>
  );
}
