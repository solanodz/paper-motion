"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { kit, type KitItem } from "@/lib/kit";
import { ShaderPreview } from "@/components/shader-preview";
import { IconArrow, IconCheck, IconKit, IconReplay, IconSpark, TYPE_ICONS } from "@/components/icons";

type Palette = { id: string; title: string; mode: string; colors: Record<string, string>; ramp: string[]; tags: string[] };
type Font = { id: string; title: string; display: string; text: string; css: string; textCss: string; tags: string[] };
type Bg = { id: string; title: string; colors: string[]; tags: string[]; entry: { shader: string; props: Record<string, unknown>; background?: string } };
export type QuizData = {
  recipes: { id: string; title: string; summary: string; poster: string | null }[];
  palettes: Palette[]; fonts: Font[]; backgrounds: Bg[];
  moves: { id: string; title: string; type: string; poster: string | null }[];
};

const FEELS = [
  { key: "calm", title: "Calm and premium", line: "Slow, soft, confident. Lots of room.", moves: ["magic-move", "blur-in", "crossfade"], fonts: ["instrument", "playfair", "dm"] },
  { key: "bold", title: "Bold and energetic", line: "Fast cuts, hits on the beat, big type.", moves: ["whip-pan", "punch", "flash"], fonts: ["archivo", "syne", "unbounded"] },
  { key: "playful", title: "Playful", line: "Springs, bounces, a wink.", moves: ["squash-drop", "pop-in", "iris"], fonts: ["bricolage", "fraunces", "space"] },
  { key: "technical", title: "Technical", line: "Precise, a terminal, numbers that count.", moves: ["dive-in", "scramble", "cells"], fonts: ["geist", "plex", "space"] },
  { key: "editorial", title: "Editorial", line: "Magazine rhythm, words that rise, clean reveals.", moves: ["unfold", "word-rise", "mask-reveal"], fonts: ["instrument", "playfair", "inter-tight"] },
];

const hex = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const dist = (a: string, b: string) => { const x = hex(a), y = hex(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };

/** Backgrounds whose colors sit closest to the palette (and its light or dark mode). */
function matchBackgrounds(p: Palette, bgs: Bg[]) {
  const ref = [p.colors.ground, p.colors.accent, ...p.ramp];
  return bgs
    .map((b) => ({ b, score: (b.colors.length ? b.colors.reduce((s, c) => s + Math.min(...ref.map((r) => dist(c, r))), 0) / b.colors.length : 999) + (b.tags.includes(p.mode) ? 0 : 60) }))
    .sort((x, y) => x.score - y.score)
    .map((x) => x.b);
}

function Step({ n, of, title, line, children }: { n: number; of: number; title: string; line: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 font-mono text-[12px] text-faint">
        <span className="text-paper">0{n}</span>
        <span className="flex gap-1">{Array.from({ length: of }, (_, i) => <span key={i} className={`h-[3px] w-6 ${i < n ? "bg-paper" : "bg-line"}`} />)}</span>
      </div>
      <h1 className="mt-5 font-serif text-[40px] leading-[1.02] tracking-[-0.02em] md:text-[60px]">{title}</h1>
      <p className="mt-3 text-[16px] text-muted">{line}</p>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function Quiz({ data }: { data: QuizData }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<{ recipe?: string; feel?: string; mode?: string; palette?: string; font?: string }>({});
  const [shuffle, setShuffle] = useState(0);
  const go = (patch: typeof a) => { setA((x) => ({ ...x, ...patch })); setStep((s) => s + 1); };
  const feel = FEELS.find((f) => f.key === a.feel);
  const palettes = data.palettes.filter((p) => !a.mode || p.mode === a.mode);
  const fonts = useMemo(() => [...data.fonts].sort((x, y) => (feel?.fonts.indexOf(y.id) ?? -1) - (feel?.fonts.indexOf(x.id) ?? -1)), [data.fonts, feel]);

  const result = useMemo(() => {
    if (step < 5) return null;
    const palette = data.palettes.find((p) => p.id === a.palette)!, font = data.fonts.find((f) => f.id === a.font)!;
    const recipe = data.recipes.find((r) => r.id === a.recipe)!;
    const bgs = matchBackgrounds(palette, data.backgrounds);
    const bg = [bgs[(shuffle * 2) % bgs.length], bgs[(shuffle * 2 + 1) % bgs.length]];
    const moves = (feel?.moves ?? []).map((id) => data.moves.find((m) => m.id === id)).filter((m) => m !== undefined);
    return { palette, font, recipe, bg, moves };
  }, [step, a, data, feel, shuffle]);

  const save = () => {
    if (!result) return;
    if (kit.get().items.length && !confirm("Replace the kit you already have with this one?")) return;
    const items: KitItem[] = [
      { id: result.palette.id, type: "palette", title: result.palette.title, values: {} },
      { id: result.font.id, type: "font-pair", title: result.font.title, values: {} },
      ...result.bg.map((b) => ({ id: b.id, type: "background", title: b.title, values: {} })),
      ...result.moves.map((m) => ({ id: m.id, type: m.type, title: m.title, values: {} })),
      { id: result.recipe.id, type: "recipe", title: result.recipe.title, values: {} },
    ];
    kit.set({ name: kit.get().name, items });
    router.push("/kit");
  };

  const card = (on: boolean) => `group relative flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${on ? "border-paper" : "border-line hover:border-faint"} bg-surface`;

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-12 md:px-8">
      <div className="mb-10 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] text-muted"><IconSpark size={16} className="text-paper" /> Start from zero</span>
        {step > 0 ? <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="text-[13px] text-muted hover:text-figure">← Back</button> : <Link href="/start/brand" className="text-[13px] text-muted hover:text-figure">I already have a brand →</Link>}
      </div>

      {step === 0 && (
        <Step n={1} of={5} title="What's the video for?" line="Pick the kind of piece. It sets the structure and the timing; the look comes next.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recipes.map((r) => (
              <button key={r.id} type="button" onClick={() => go({ recipe: r.id })} className={card(a.recipe === r.id)}>
                <div className="aspect-video overflow-hidden border-b border-line bg-black">{r.poster ? <img src={`/${r.poster}`} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" /> : null}</div>
                <div className="p-4"><div className="text-[16px] font-medium">{r.title}</div><p className="mt-1 text-[13px] leading-snug text-muted">{r.summary}</p></div>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step n={2} of={5} title="How should it feel?" line="This picks the motion: how things enter, leave and land.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEELS.map((f) => (
              <button key={f.key} type="button" onClick={() => go({ feel: f.key })} className={`${card(a.feel === f.key)} p-5`}>
                <span className="font-serif text-[28px] leading-none tracking-[-0.02em]">{f.title}</span>
                <span className="mt-3 text-[13.5px] text-muted">{f.line}</span>
                <span className="mt-5 flex flex-wrap gap-1.5">{f.moves.map((m) => <span key={m} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10.5px] text-faint">{m}</span>)}</span>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step === 2 && (
        <Step n={3} of={5} title="Light or dark?" line="Where your video lives: a dark feed, a bright landing page, a slide deck.">
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ k: "dark", bg: "#0b0b0a", fg: "#f4f4ee", t: "Dark" }, { k: "light", bg: "#ece6d6", fg: "#141311", t: "Light" }].map((m) => (
              <button key={m.k} type="button" onClick={() => go({ mode: m.k })} className={card(a.mode === m.k)}>
                <div className="flex aspect-[16/8] items-end p-6" style={{ background: m.bg }}><span className="font-serif text-[64px] leading-none tracking-[-0.03em]" style={{ color: m.fg }}>{m.t}.</span></div>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step n={4} of={5} title="Which colors feel like you?" line="A palette with roles: ground, type, a muted tone, a surface and one accent. You can tune every color later.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {palettes.map((p) => (
              <button key={p.id} type="button" onClick={() => go({ palette: p.id })} className={card(a.palette === p.id)}>
                <div className="flex aspect-[4/3] flex-col justify-between p-4" style={{ background: p.colors.ground }}>
                  <span className="font-serif text-[30px] leading-none tracking-[-0.02em]" style={{ color: p.colors.figure }}>{p.title}</span>
                  <span className="flex gap-1">{[p.colors.surface, p.colors.muted, ...p.ramp.slice(1), p.colors.accent].map((c, i) => <span key={i} className="h-5 flex-1 rounded-sm" style={{ background: c }} />)}</span>
                </div>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step n={5} of={5} title="Pick a type voice." line={`Free fonts from Google Fonts${feel ? `, the ones that suit "${feel.title.toLowerCase()}" first` : ""}.`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fonts.map((f) => (
              <button key={f.id} type="button" onClick={() => go({ font: f.id })} className={`${card(a.font === f.id)} p-5`}>
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link rel="stylesheet" href={f.css} />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link rel="stylesheet" href={f.textCss} />
                <span className="truncate text-[44px] leading-none tracking-[-0.02em]" style={{ fontFamily: `'${f.display}'`, fontWeight: 600 }}>Make it move</span>
                <span className="mt-3 text-[14px] text-muted" style={{ fontFamily: `'${f.text}'` }}>Body text reads like this, at a glance.</span>
                <span className="mt-4 font-mono text-[11px] text-faint">{f.title}</span>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step >= 5 && result && (
        <div>
          <div className="flex items-center gap-2 text-paper"><IconKit size={18} /><span className="text-[14px] font-medium">Your kit is ready</span></div>
          <h1 className="mt-4 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] md:text-[64px]">A {result.recipe.title.toLowerCase()} that feels {feel?.title.toLowerCase()}.</h1>
          <p className="mt-3 max-w-[60ch] text-[16px] text-muted">Save it, then tune anything in the library. Your agent gets it as one prompt.</p>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-line" style={{ background: result.palette.colors.ground }}>
              {/* eslint-disable-next-line @next/next/no-page-custom-font */}
              <link rel="stylesheet" href={result.font.css} />
              <div className="relative aspect-video">
                <ShaderPreview entry={result.bg[0].entry} className="absolute inset-0 h-full w-full opacity-90" />
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <span className="text-[clamp(36px,5vw,72px)] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: `'${result.font.display}'`, color: result.palette.colors.figure, fontWeight: 600 }}>Your brand, moving.</span>
                  <span className="mt-3 inline-flex w-fit rounded px-2 py-1 font-mono text-[12px]" style={{ background: result.palette.colors.accent, color: result.palette.colors.ground }}>{result.recipe.title}</span>
                </div>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {[
                { t: "palette", title: result.palette.title, id: result.palette.id },
                { t: "font-pair", title: result.font.title, id: result.font.id },
                ...result.bg.map((b) => ({ t: "background", title: b.title, id: b.id })),
                ...result.moves.map((m) => ({ t: m.type, title: m.title, id: m.id })),
                { t: "recipe", title: result.recipe.title, id: result.recipe.id },
              ].map((x) => {
                const Icon = TYPE_ICONS[x.t];
                return (
                  <li key={x.id}>
                    <Link href={`/r/${x.id}`} className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5 hover:border-faint">
                      <Icon size={15} className="text-paper" /><span className="flex-1 truncate text-[14px]">{x.title}</span><span className="font-mono text-[11px] text-faint">{x.id}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={save} className="flex items-center gap-2 rounded-lg bg-paper px-5 py-3 text-[14px] font-medium text-ground hover:bg-figure"><IconCheck size={16} /> Save as my kit <IconArrow size={15} /></button>
            <button type="button" onClick={() => setShuffle((s) => s + 1)} className="flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-[14px] text-figure hover:border-faint"><IconReplay size={15} /> Other backgrounds</button>
            <button type="button" onClick={() => { setStep(0); setA({}); }} className="px-3 py-3 text-[13.5px] text-muted hover:text-figure">Start over</button>
          </div>
        </div>
      )}
    </div>
  );
}
