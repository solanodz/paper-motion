"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { changed as changedOf, setArgs } from "@/lib/customize.mjs";
import { kit, useKit, type KitItem } from "@/lib/kit";
import { copyText } from "@/components/playground/code-view";
import { IconAgent, IconArrow, IconBrand, IconCheck, IconClose, IconCopy, IconGrid, IconKit, IconSpark, TYPE_ICONS } from "@/components/icons";

type Res = { id: string; type: string; params?: { name: string; default?: unknown; hidden?: boolean }[] };

const GROUPS = [
  { key: "look", title: "Look", types: ["palette", "font-pair"], hint: "a palette and a font pair", browse: "/library?type=palette" },
  { key: "material", title: "Material", types: ["background"], hint: "a background or two", browse: "/library?type=background" },
  { key: "motion", title: "Motion", types: ["component", "transition", "text", "camera"], hint: "two or three moves", browse: "/library?type=component" },
  { key: "structure", title: "Structure", types: ["recipe"], hint: "a recipe for the whole video", browse: "/library?type=recipe" },
];

const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

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

  if (!k.items.length) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-line p-8 md:p-12">
        <IconKit size={28} className="text-paper" />
        <h2 className="mt-5 font-serif text-[36px] leading-none tracking-[-0.02em]">Your kit is empty.</h2>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">A kit is what your agent builds your video from: a look, a material, some motion and a structure. It fills up as you choose on the boards your agent sends you.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[{ href: "/", icon: IconSpark, t: "Ask your agent to propose" }, { href: "/kit/brand", icon: IconBrand, t: "Set your brand’s look" }, { href: "/library", icon: IconGrid, t: "Browse the library" }].map((d) => (
            <Link key={d.href} href={d.href} className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-faint">
              <d.icon size={17} className="text-paper" /><span className="flex-1 text-[14px]">{d.t}</span><IconArrow size={14} className="text-faint transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const row = (i: KitItem) => {
    const Icon = TYPE_ICONS[i.type], d = defs[i.id];
    const n = d ? changedOf(d, i.values).length : 0;
    const diff = Object.fromEntries(Object.entries(i.values).filter(([key, v]) => d?.params?.find((p) => p.name === key && JSON.stringify(p.default) !== JSON.stringify(v))));
    return (
      <li key={i.id} className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-paper"><Icon size={15} /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium">{i.title}</div>
          <div className="font-mono text-[11px] text-faint">{i.id}{n ? ` · ${n} tuned` : " · defaults"}</div>
        </div>
        <Link href={`/r/${i.id}${Object.keys(diff).length ? `?s=${enc(diff)}` : ""}`} className="rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:text-figure">Tune</Link>
        <button type="button" onClick={() => kit.remove(i.id)} aria-label={`Remove ${i.title}`} className="rounded-md p-1.5 text-faint hover:text-figure"><IconClose size={14} /></button>
      </li>
    );
  };

  return (
    <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-8">
        <label className="block">
          <span className="text-[13px] text-muted">Who is this video for?</span>
          <input value={k.name} onChange={(e) => kit.setName(e.target.value)} placeholder="Your brand's name" className="mt-2 w-full max-w-[420px] rounded-md border border-line bg-surface px-3 py-2 text-[15px] text-figure outline-none placeholder:text-faint focus:border-faint" />
        </label>
        {GROUPS.map((g) => {
          const list = k.items.filter((i) => g.types.includes(i.type));
          return (
            <section key={g.key}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[16px] font-medium">{g.title}{g.key === "look" ? <Link href="/kit/brand" className="ml-3 text-[12.5px] font-normal text-muted underline decoration-faint underline-offset-4 hover:text-figure">set by hand</Link> : null}</h2>
                {list.length ? <span className="flex items-center gap-1 text-[12px] text-paper"><IconCheck size={12} /> {list.length}</span> : null}
              </div>
              {list.length ? <ul className="flex flex-col gap-2">{list.map(row)}</ul> : (
                <Link href={g.browse} className="group flex items-center justify-between rounded-lg border border-dashed border-line px-4 py-3.5 text-[13.5px] text-muted hover:border-faint hover:text-figure">
                  <span>Add {g.hint}</span><IconArrow size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </section>
          );
        })}
        <button type="button" onClick={() => { if (confirm("Empty the kit?")) kit.clear(); }} className="w-fit text-[12.5px] text-faint hover:text-figure">Empty the kit</button>
      </div>

      <aside className="xl:sticky xl:top-20 xl:h-fit">
        <div className="corner-marks rounded-xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="flex items-center gap-2 text-[13.5px] font-medium"><IconAgent size={15} className="text-paper" /> Prompt for your agent</span>
            <button type="button" onClick={async () => { if (await copyText(prompt)) done("prompt"); }} className="flex items-center gap-1.5 rounded-md bg-paper px-3 py-1.5 text-[12.5px] font-medium text-ground hover:bg-figure">
              {flash === "prompt" ? <IconCheck size={13} /> : <IconCopy size={13} />}{flash === "prompt" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[12.5px] leading-relaxed text-figure">{prompt}</pre>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-[12.5px] text-muted">Only the command</span>
            <button type="button" onClick={async () => { if (await copyText(command)) done("cmd"); }} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:text-figure">
              {flash === "cmd" ? <IconCheck size={12} /> : <IconCopy size={12} />}{flash === "cmd" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">Paste it in Claude Code, Codex, Cursor or any agent that runs commands. It installs the kit in your project and makes the video with you.</p>
      </aside>
    </div>
  );
}
