"use client";

import { useState } from "react";
import { IconAgent, IconCheck, IconCopy, IconLink } from "@/components/icons";

type Tab = { key: string; label: string; code: string };

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** The code for the current settings: tabs as flush cells over the block, "N changed", Copy, and "Copy for your agent". */
export function CodeView({ tabs, changed, agent, showAll, setShowAll, canShowAll, onShare, tall = false }: {
  tabs: Tab[]; changed: number; agent: string; showAll: boolean; setShowAll: (b: boolean) => void; canShowAll: boolean; onShare: () => Promise<boolean>; tall?: boolean;
}) {
  const [tab, setTab] = useState(tabs[0]?.key);
  const [flash, setFlash] = useState("");
  const cur = tabs.find((t) => t.key === tab) ?? tabs[0];
  const done = (what: string) => { setFlash(what); setTimeout(() => setFlash(""), 1300); };
  if (!cur) return null;
  return (
    <div>
      <div className="flex items-stretch justify-between border border-b-0 border-line">
        <div className="cells min-w-0 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={t.key === cur.key} className={`cell h-10 shrink-0 border-l-0 border-r border-line font-mono text-[12px] ${t.key === cur.key ? "cell-on" : ""}`}>{t.label}</button>
          ))}
        </div>
        <div className="cells -ml-px shrink-0">
          {canShowAll && cur.key === "usage" ? (
            <label className="cell cursor-pointer px-3 text-[12.5px] hover:text-figure">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-3.5 w-3.5 shrink-0 cursor-pointer appearance-none border border-rule bg-transparent checked:border-paper checked:bg-paper" />
              All options
            </label>
          ) : null}
          <button type="button" onClick={async () => { if (await copyText(cur.code)) done("code"); }} className={`cell h-10 px-3.5 text-[12.5px] ${flash === "code" ? "cell-on" : ""}`}>
            {flash === "code" ? <IconCheck size={13} /> : <IconCopy size={13} />}{flash === "code" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className={`code overflow-auto p-4 text-figure ${tall ? "max-h-[70vh]" : "max-h-[420px]"}`}>{cur.code}</pre>
      <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-line p-3">
        <span className={`tag ${changed ? "tag-paper" : ""}`}>{changed ? `${changed} changed` : "Defaults"}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={async () => { if (await onShare()) done("share"); }} className={`btn btn-sm ${flash === "share" ? "btn-primary" : ""}`}>
            {flash === "share" ? <IconCheck size={13} /> : <IconLink size={13} />}{flash === "share" ? "Link copied" : "Share link"}
          </button>
          <button type="button" onClick={async () => { if (await copyText(agent)) done("agent"); }} className={`btn btn-sm ${flash === "agent" ? "btn-primary" : ""}`}>
            {flash === "agent" ? <IconCheck size={13} /> : <IconAgent size={13} />}{flash === "agent" ? "Copied" : "Copy for your agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { copyText };
