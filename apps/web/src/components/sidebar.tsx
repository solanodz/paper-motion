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

  // every row runs edge to edge: the one you are on is paper, the one you point at inverts
  const rowBase = "flex items-center gap-2.5 px-5";
  const nav = (
    <nav className="flex flex-col pb-16 text-[13.5px]">
      <ul className="border-b border-line">
        {top.map((l) => {
          const Icon = l.icon, on = path === l.href || (l.href === "/kit" && path.startsWith("/kit"));
          return (
            <li key={l.href}>
              <Link href={l.href} aria-current={on ? "page" : undefined} className={`${rowBase} h-10 ${on ? "bg-paper text-ground" : "text-figure hover:bg-figure hover:text-ground"}`}>
                <Icon size={16} />
                <span className="flex-1">{l.label}</span>
                {l.badge ? <span className="font-mono text-[12px]">{l.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <label className={`${rowBase} h-11 border-b border-line focus-within:bg-surface`}>
        <IconSearch size={15} className="shrink-0 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a resource" className="w-full bg-transparent font-mono text-[12.5px] text-figure outline-none placeholder:text-faint" />
        {q ? <button type="button" onClick={() => setQ("")} aria-label="Clear the search" className="text-muted hover:text-figure"><IconClose size={13} /></button> : null}
      </label>

      {filtered.map((s) => {
        const Icon = TYPE_ICONS[s.type], isClosed = q ? false : (closed[s.type] ?? false);
        const hasCurrent = s.items.some((i) => i.id === current);
        return (
          <div key={s.type} className="border-b border-line">
            <button type="button" aria-expanded={!isClosed} onClick={() => setClosed((c) => ({ ...c, [s.type]: !isClosed }))} className={`${rowBase} group h-10 w-full text-left hover:bg-figure hover:text-ground`}>
              <Icon size={16} className={hasCurrent ? "text-paper group-hover:text-ground" : "text-muted group-hover:text-ground"} />
              <span className="flex-1 text-[13px] font-medium">{s.title}</span>
              <span className="font-mono text-[11px] text-muted group-hover:text-ground/60">{s.items.length}</span>
              <IconChevron size={12} className={`text-muted group-hover:text-ground ${isClosed ? "" : "rotate-90"}`} />
            </button>
            {!isClosed && (
              <ul className="pb-2">
                {s.items.map((i) => {
                  const on = i.id === current;
                  return (
                    <li key={i.id}>
                      <Link href={`/r/${i.id}`} aria-current={on ? "page" : undefined} className={`flex h-[30px] items-center gap-2.5 pl-[46px] pr-5 ${on ? "bg-paper text-ground" : "text-muted hover:bg-figure hover:text-ground"}`}>
                        <span className="flex-1 truncate">{i.title}</span>
                        {inKit.has(i.id) ? <IconKit size={13} className="shrink-0" /> : null}
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
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn btn-primary fixed bottom-4 left-4 z-50 lg:hidden">
        {open ? <IconClose size={14} /> : <IconGrid size={14} />} {open ? "Close" : "Menu"}
      </button>
      {open && <div className="fixed inset-x-0 bottom-0 top-[52px] z-40 overflow-y-auto bg-ground lg:hidden">{nav}</div>}
      <aside className="sticky top-[52px] hidden h-[calc(100vh-52px)] w-[264px] shrink-0 overflow-y-auto border-r border-line lg:block">{nav}</aside>
    </>
  );
}
