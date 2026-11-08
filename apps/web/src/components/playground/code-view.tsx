"use client";

import { useState } from "react";

type Tab = { key: string; label: string; code: string };

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** The code for the current settings: tabs per type, "N changed", Copy, and "Copy for your agent". */
export function CodeView({ tabs, changed, agent, showAll, setShowAll, canShowAll, onShare, tall = false }: {
  tabs: Tab[]; changed: number; agent: string; showAll: boolean; setShowAll: (b: boolean) => void; canShowAll: boolean; onShare: () => Promise<boolean>; tall?: boolean;
}) {
  const [tab, setTab] = useState(tabs[0]?.key);
  const [flash, setFlash] = useState("");
  const cur = tabs.find((t) => t.key === tab) ?? tabs[0];
  const done = (what: string) => { setFlash(what); setTimeout(() => setFlash(""), 1300); };
  if (!cur) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line pl-2 pr-2">
        <div className="flex min-w-0 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`shrink-0 border-b-2 px-3 py-2.5 font-mono text-[12px] ${t.key === cur.key ? "border-figure text-figure" : "border-transparent text-muted hover:text-figure"}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canShowAll && cur.key === "usage" ? (
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-faint"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> all options</label>
          ) : null}
          <button type="button" onClick={async () => { if (await copyText(cur.code)) done("code"); }} className="rounded border border-line px-2.5 py-1 font-mono text-[11.5px] text-muted hover:text-figure">{flash === "code" ? "copied" : "Copy"}</button>
        </div>
      </div>
      <pre className={`overflow-auto p-4 font-mono text-[12px] leading-relaxed text-figure ${tall ? "max-h-[70vh]" : "max-h-[420px]"}`}>{cur.code}</pre>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <span className="font-mono text-[11px] text-faint">{changed ? `${changed} changed` : "defaults"}</span>
        <div className="flex gap-2">
          <button type="button" onClick={async () => { if (await onShare()) done("share"); }} className="rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:text-figure">{flash === "share" ? "link copied" : "Share link"}</button>
          <button type="button" onClick={async () => { if (await copyText(agent)) done("agent"); }} className="rounded bg-figure px-3 py-1.5 font-mono text-[11.5px] text-ground hover:opacity-85">{flash === "agent" ? "copied" : "Copy for your agent"}</button>
        </div>
      </div>
    </div>
  );
}

export { copyText };
