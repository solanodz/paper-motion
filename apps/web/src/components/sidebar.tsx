"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useKit } from "@/lib/kit";
import { IconAgent, IconChevron, IconClose, IconGrid, IconKit, IconSearch, TYPE_ICONS } from "./icons";

type Item = { id: string; title: string };
type Section = { type: string; title: string; items: Item[] };

/** The library's left menu: where to start, the kit, then every resource grouped by type. */
export function Sidebar({ sections }: { sections: Section[] }) {
  const path = usePathname();
  const kit = useKit();
  const current = path.startsWith("/r/") ? path.slice(3) : null;
  const inKit = new Set(kit.items.map((i) => i.id));
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const filtered = useMemo(() => {
    const w = q.toLowerCase().trim();
    return sections.map((s) => ({ ...s, items: w ? s.items.filter((i) => `${i.id} ${i.title}`.toLowerCase().includes(w)) : s.items })).filter((s) => s.items.length);
  }, [sections, q]);

  const top = [
    { href: "/kit", label: "Your kit", icon: IconKit, badge: kit.items.length || null },
    { href: "/library", label: "All resources", icon: IconGrid },
    { href: "/docs", label: "For agents", icon: IconAgent },
  ];

  const nav = (
    <nav className="flex flex-col gap-7 pb-12 text-[13.5px]">
      <ul className="flex flex-col gap-0.5">
        {top.map((l) => {
          const Icon = l.icon, on = path === l.href || (l.href === "/kit" && path.startsWith("/kit"));
          return (
            <li key={l.href}>
              <Link href={l.href} className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${on ? "bg-raised text-figure" : "text-muted hover:text-figure"}`}>
                <Icon size={16} className={on ? "text-paper" : ""} />
                <span className="flex-1">{l.label}</span>
                {l.badge ? <span className="rounded-full bg-paper px-1.5 font-mono text-[10.5px] leading-[17px] text-ground">{l.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 focus-within:border-faint">
        <IconSearch size={14} className="shrink-0 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a resource" className="w-full bg-transparent font-mono text-[12.5px] text-figure outline-none placeholder:text-faint" />
        {q ? <button type="button" onClick={() => setQ("")} aria-label="Clear"><IconClose size={12} className="text-faint" /></button> : null}
      </label>

      {filtered.map((s) => {
        const Icon = TYPE_ICONS[s.type], isClosed = q ? false : (closed[s.type] ?? false);
        const hasCurrent = s.items.some((i) => i.id === current);
        return (
          <div key={s.type}>
            <button type="button" onClick={() => setClosed((c) => ({ ...c, [s.type]: !isClosed }))} className="group mb-1.5 flex w-full items-center gap-2.5 px-2 text-left">
              <Icon size={16} className={hasCurrent ? "text-paper" : "text-faint group-hover:text-muted"} />
              <span className={`flex-1 text-[13px] font-medium ${hasCurrent ? "text-figure" : "text-muted group-hover:text-figure"}`}>{s.title}</span>
              <span className="font-mono text-[10.5px] text-faint">{s.items.length}</span>
              <IconChevron size={12} className={`text-faint transition-transform ${isClosed ? "" : "rotate-90"}`} />
            </button>
            {!isClosed && (
              <ul className="flex flex-col">
                {s.items.map((i) => {
                  const on = i.id === current;
                  return (
                    <li key={i.id}>
                      <Link href={`/r/${i.id}`} className={`group flex items-center gap-2.5 rounded-md py-[5px] pl-[34px] pr-2 transition-colors ${on ? "bg-raised text-figure" : "text-muted hover:text-figure"}`}>
                        {/* a frame marker: empty, scanning on hover, filled when it's the page you're on */}
                        <span className={`relative h-[7px] shrink-0 overflow-hidden border transition-all duration-200 ${on ? "w-[7px] border-paper bg-paper" : "w-[7px] border-faint group-hover:w-[14px] group-hover:border-muted"}`} />
                        <span className="flex-1 truncate">{i.title}</span>
                        {inKit.has(i.id) ? <IconKit size={12} className="shrink-0 text-paper" /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-line bg-raised px-4 py-2 font-mono text-[12px] text-figure shadow-lg lg:hidden">
        {open ? <IconClose size={14} /> : <IconGrid size={14} />} {open ? "Close" : "Menu"}
      </button>
      {open && <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-ground px-5 pt-6 lg:hidden">{nav}</div>}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[256px] shrink-0 overflow-y-auto border-r border-line py-7 pr-4 lg:block">{nav}</aside>
    </>
  );
}
