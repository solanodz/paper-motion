"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { changed as changedOf, setArgs } from "@/lib/customize.mjs";
import { kit, useKit, type KitItem } from "@/lib/kit";
import { copyText } from "@/components/playground/code-view";
import { IconAgent, IconBrand, IconCheck, IconClose, IconCopy, IconGrid, IconPlus, IconSpark, TYPE_ICONS } from "@/components/icons";

type Res = { id: string; type: string; params?: { name: string; default?: unknown; hidden?: boolean }[] };

const GROUPS = [
  { key: "look", title: "Look", types: ["palette", "font-pair"], hint: "a palette and a font pair", browse: "/library?type=palette" },
  { key: "material", title: "Material", types: ["background"], hint: "a background or two", browse: "/library?type=background" },
  { key: "motion", title: "Motion", types: ["component", "transition", "text", "camera"], hint: "two or three moves", browse: "/library?type=component" },
  { key: "structure", title: "Structure", types: ["recipe"], hint: "a recipe for the whole video", browse: "/library?type=recipe" },
];

const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// a row of the kit: a narrow label, and what it holds
const ROW = "row sm:grid-cols-[132px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]";
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);
const shown = (v: unknown) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));

/** One tuned value: its name and what it was set to; colors show as swatches. */
function Tuned({ name, value }: { name: string; value: unknown }) {
  const list: unknown[] = Array.isArray(value) ? value : [value];
  const colors = list.length > 0 && list.every(isHex);
  return (
    <span className="tag max-w-full overflow-hidden" title={`${name}=${shown(value)}`}>
      <span>{name}</span>
      {colors ? list.map((c, i) => <i key={i} className="h-2.5 w-2.5 shrink-0 border border-rule" style={{ background: c as string }} />) : null}
      {colors && list.length > 1 ? null : <span className="min-w-0 truncate text-figure">{shown(value)}</span>}
    </span>
  );
}

export function KitView({ site }: { site: string }) {
  const k = useKit();
  const [defs, setDefs] = useState<Record<string, Res>>({});
  const [flash, setFlash] = useState("");

  useEffect(() => {
    for (const i of k.items) if (!defs[i.id]) fetch(`/r/${i.id}.json`).then((r) => r.json()).then((d) => setDefs((x) => ({ ...x, [i.id]: d })));
  }, [k.items, defs]);

  const args = useMemo(() => k.items.flatMap((i) => (defs[i.id] ? (setArgs(defs[i.id], i.values) as string[]).map((a) => a.replace(/^--set ('?)/, `--set $1${i.id}:`)) : [])), [k.items, defs]);
  const ids = k.items.map((i) => i.id);
  const command = `npx paper-motion add ${ids.join(" ")}${args.length ? ` ${args.join(" ")}` : ""}`;
  const recipe = k.items.find((i) => i.type === "recipe");
  const prompt = `Use paper-motion.app to make ${recipe ? `a ${recipe.title.toLowerCase()} video` : "a video"} for ${k.name || "my brand"} with this kit. Read ${site}/llms.txt, then install it in my project with:\n\n${command}\n\nFollow the make-video skill: agree a brief with me first, then build, check stills and render.`;
  const done = (what: string) => { setFlash(what); setTimeout(() => setFlash(""), 1300); };

  const row = (i: KitItem) => {
    const Icon = TYPE_ICONS[i.type], d = defs[i.id];
    const n = d ? changedOf(d, i.values).length : 0;
    const diff = Object.fromEntries(Object.entries(i.values).filter(([key, v]) => d?.params?.find((p) => p.name === key && JSON.stringify(p.default) !== JSON.stringify(v))));
    const tuned = Object.entries(diff);
    return (
      <li key={i.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-b border-line py-3.5 first:pt-0 last:border-b-0 last:pb-0">
        <span className="grid h-9 w-9 place-items-center border border-rule text-muted"><Icon size={16} /></span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium leading-tight">{i.title}</div>
          <div className="mt-1 truncate font-mono text-[12px] leading-none text-muted">{i.id}</div>
        </div>
        <div className="flex">
          <Link href={`/r/${i.id}${Object.keys(diff).length ? `?s=${enc(diff)}` : ""}`} className="btn btn-sm h-9">Tune</Link>
          <button type="button" onClick={() => kit.remove(i.id)} aria-label={`Remove ${i.title}`} className="btn btn-sm -ml-px h-9 w-9 px-0"><IconClose size={14} /></button>
        </div>
        <div className="col-start-2 col-end-4 flex min-w-0 flex-wrap gap-1.5">
          {tuned.length ? tuned.map(([name, value]) => <Tuned key={name} name={name} value={value} />) : <span className="tag">{n ? `${n} tuned` : "defaults"}</span>}
        </div>
      </li>
    );
  };

  // the four things a kit holds: what was picked for each, or the way to add it
  const groups = GROUPS.map((g) => {
    const list = k.items.filter((i) => g.types.includes(i.type));
    return (
      <section key={g.key} className={ROW}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2.5 sm:flex-col">
          <h2 className="font-serif text-[26px] leading-none tracking-[-0.01em] text-figure">{g.title}</h2>
          {list.length ? <span className="flex items-center gap-1.5 font-mono text-[12px] text-ok"><IconCheck size={13} />{list.length}</span> : null}
          {g.key === "look" ? <Link href="/kit/brand" className="text-[13px] underline decoration-rule underline-offset-4 hover:bg-figure hover:text-ground">Set by hand</Link> : null}
        </div>
        {list.length ? <ul>{list.map(row)}</ul> : (
          <Link href={g.browse} className="btn w-fit max-w-full"><IconPlus size={14} />Add {g.hint}</Link>
        )}
      </section>
    );
  });

  if (!k.items.length) {
    return (
      <div className="-mx-5 border-t border-line px-5 pb-28 pt-12 md:-mx-10 md:px-10">
        <h2 className="title">Your kit is empty.</h2>
        <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed text-muted">A kit is what your agent builds your video from: a look, a material, some motion and a structure. It fills up as you choose on the boards your agent sends you, or as you add resources from the library.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/library" className="btn btn-primary"><IconGrid size={15} />Browse the library</Link>
          <Link href="/kit/brand" className="btn"><IconBrand size={15} />Set your brand’s look</Link>
          <Link href="/" className="btn"><IconSpark size={15} />Ask your agent to propose</Link>
        </div>
        <div className="rows mt-14 max-w-[980px]">{groups}</div>
      </div>
    );
  }

  return (
    <div className="-mx-5 border-t border-line md:-mx-10 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="px-5 pb-16 md:px-10 xl:pb-28">
        <div className="rows border-t-0">
          <label className={ROW}>
            <span className="text-[14px] sm:pt-3">Who is this video for?</span>
            <input value={k.name} onChange={(e) => kit.setName(e.target.value)} placeholder="Your brand's name" className="field font-serif text-[28px] leading-tight tracking-[-0.01em]" />
          </label>
          {groups}
        </div>
        <button type="button" onClick={() => { if (confirm("Empty the kit?")) kit.clear(); }} className="btn btn-sm mt-6">Empty the kit</button>
      </div>

      <aside className="border-t border-line px-5 pb-24 pt-8 md:px-10 xl:sticky xl:top-[52px] xl:h-[calc(100vh-52px)] xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0 xl:px-6 xl:pb-10">
        <div className="code corner-marks">
          <div className="flex items-stretch justify-between border-b border-line">
            <h2 className="flex min-w-0 items-center gap-2.5 px-4 py-3 font-sans text-[14px] font-medium leading-tight"><IconAgent size={16} className="shrink-0 text-paper" />Prompt for your agent</h2>
            <button type="button" onClick={async () => { if (await copyText(prompt)) done("prompt"); }} className="btn btn-primary shrink-0 border-y-0 border-r-0">
              {flash === "prompt" ? <IconCheck size={14} /> : <IconCopy size={14} />}{flash === "prompt" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-[1.6] text-figure">{prompt}</pre>
          <div className="flex items-stretch justify-between border-t border-line">
            <span className="flex items-center px-4 py-2.5 font-sans text-[13px] text-muted">Only the command</span>
            <button type="button" onClick={async () => { if (await copyText(command)) done("cmd"); }} className="btn btn-sm shrink-0 border-y-0 border-r-0 border-line">
              {flash === "cmd" ? <IconCheck size={14} /> : <IconCopy size={14} />}{flash === "cmd" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-muted">Paste it in Claude Code, Codex, Cursor or any agent that runs commands. It installs the kit in your project and makes the video with you.</p>
      </aside>
    </div>
  );
}
