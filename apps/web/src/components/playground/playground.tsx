"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apply, code as codeFor, defaults as defaultsOf, MOVE_TYPES } from "@/lib/customize.mjs";
import { ShaderPreview } from "@/components/shader-preview";
import { Controls, type Param } from "./controls";
import { CodeView, copyText } from "./code-view";
import { DURATION, MovePlayer, type PlayerHandle } from "./move-player";

type Values = Record<string, unknown>;
export type PlaygroundResource = {
  id: string; type: string; title: string; export?: string; signature?: string; params?: Param[];
  files: { path: string; content?: string; url?: string }[]; install: { kind: string; entry?: Record<string, unknown> };
  preview?: { video?: string; poster?: string };
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
const REMOUNT = ["seed", "separator", "from", "to"];

function PalettePreview({ entry }: { entry: { colors: Record<string, { hex: string }>; ramp: string[] } }) {
  const c = entry.colors;
  const ratio = (a: string, b: string) => {
    const l = (h: string) => { const n = parseInt(h.slice(1, 7), 16); const v = [n >> 16 & 255, n >> 8 & 255, n & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const [x, y] = [l(a), l(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05);
  };
  const fig = ratio(c.figure.hex, c.ground.hex), mut = ratio(c.muted.hex, c.ground.hex);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: c.ground.hex }}>
      <div className="flex flex-1 flex-col justify-center px-[6%]">
        <div className="font-serif text-[clamp(40px,7vw,104px)] leading-none tracking-[-0.03em]" style={{ color: c.figure.hex }}>Every frame.</div>
        <div className="mt-4 max-w-[46ch] text-[clamp(13px,1.4vw,18px)]" style={{ color: c.muted.hex }}>Secondary text sits in muted. The accent is for <span style={{ color: c.accent.hex }}>one moment</span>.</div>
        <div className="mt-6 inline-flex w-fit rounded-lg px-4 py-3 font-mono text-[12px]" style={{ background: c.surface.hex, color: c.figure.hex }}>surface · a card or a panel</div>
        <div className="mt-5 flex gap-3 font-mono text-[11px]">
          <span style={{ color: fig < 7 ? "#ff6b4a" : c.muted.hex }}>figure {fig.toFixed(1)}:1{fig < 7 ? " · low" : ""}</span>
          <span style={{ color: mut < 3 ? "#ff6b4a" : c.muted.hex }}>muted {mut.toFixed(1)}:1{mut < 3 ? " · low" : ""}</span>
        </div>
      </div>
      <div className="flex h-[16%]">{(entry.ramp ?? []).map((h, i) => <div key={i} className="flex-1" style={{ background: h }} />)}</div>
    </div>
  );
}

function FontPreview({ entry }: { entry: { fonts: Record<string, { family: string; css?: string }>; type: { display: { weight: number; tracking: string } } } }) {
  const f = entry.fonts;
  const links = [...new Set(Object.values(f).map((x) => x.css).filter(Boolean) as string[])];
  return (
    <div className="flex h-full w-full flex-col justify-center bg-raised px-[6%]">
      {links.map((href) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <div className="truncate leading-[0.95]" style={{ fontFamily: `'${f.display.family}'`, fontWeight: entry.type.display.weight, letterSpacing: entry.type.display.tracking, fontSize: "clamp(44px,8vw,120px)" }}>Make it move.</div>
      <p className="mt-5 max-w-[52ch] text-muted" style={{ fontFamily: `'${f.text.family}'`, fontSize: "clamp(14px,1.5vw,20px)" }}>Body text for captions and lines that explain. Readable at a glance, in any format.</p>
      <p className="mt-3 text-faint" style={{ fontFamily: `'${f.mono.family}'`, fontSize: "clamp(11px,1vw,14px)" }}>$ npx paper-motion add · {f.display.family} / {f.text.family} / {f.mono.family}</p>
    </div>
  );
}

/** A resource's playground, "Inspector" layout: stage + playback, parameters panel, code below. */
export function Playground({ resource: r, site, backgrounds }: { resource: PlaygroundResource; site: string; backgrounds: string[] }) {
  const defaults = useMemo(() => defaultsOf(r) as Values, [r]);
  const [values, setValues] = useState<Values>(defaults);
  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [full, setFull] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "code">("preview");
  const player = useRef<PlayerHandle>(null);
  const isMove = MOVE_TYPES.includes(r.type);
  const key = `pm:v:${r.id}`;

  // restore: the shared link first, then this browser's last settings
  useEffect(() => {
    try {
      const s = new URLSearchParams(location.search).get("s");
      const saved = s ? dec(s) : JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved && typeof saved === "object") setValues({ ...defaults, ...saved });
    } catch { /* ignore a bad link or blocked storage */ }
  }, [defaults, key]);
  const diff = useMemo(() => Object.fromEntries(Object.entries(values).filter(([k, v]) => !same(v, defaults[k]))), [values, defaults]);
  useEffect(() => {
    try { if (Object.keys(diff).length) localStorage.setItem(key, JSON.stringify(diff)); else localStorage.removeItem(key); } catch { /* storage blocked */ }
  }, [diff, key]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = (k: string, v: unknown) => setValues((x) => ({ ...x, [k]: v }));
  const reset = () => setValues(defaults);
  const out = useMemo(() => codeFor(r, values, { showAll, site }) as { tabs: { key: string; label: string; code: string }[]; changed: number; agent: string }, [r, values, showAll, site]);
  const entry = useMemo(() => (apply(r, values) as { install: { entry?: Record<string, unknown> } }).install.entry, [r, values]);
  const remountKey = JSON.stringify(REMOUNT.map((k) => (r.type === "text" ? values[k] : null)));
  const share = async () => {
    const url = new URL(location.href);
    url.searchParams.delete("variant");
    if (Object.keys(diff).length) url.searchParams.set("s", enc(diff)); else url.searchParams.delete("s");
    return copyText(url.toString());
  };

  let stage: React.ReactNode = null;
  if (isMove) stage = <MovePlayer ref={player} id={r.id} values={values} playing={playing} speed={speed} remountKey={remountKey} onTime={setTime} />;
  else if (r.type === "background" && entry) {
    const props = { ...(entry.props as Values), speed: playing ? Number((entry.props as Values).speed ?? 1) * speed : 0 };
    stage = <ShaderPreview key={JSON.stringify((entry.props as Values).colors ?? "")} entry={{ ...(entry as { shader: string }), props }} className="h-full w-full" />;
  } else if (r.type === "palette" && entry) stage = <PalettePreview entry={entry as never} />;
  else if (r.type === "font-pair" && entry) stage = <FontPreview entry={entry as never} />;
  else if (r.preview?.video) stage = <video src={`/${r.preview.video}`} poster={r.preview.poster ? `/${r.preview.poster}` : undefined} autoPlay muted loop playsInline className="h-full w-full object-cover" />;

  const playback = isMove || r.type === "background" ? (
    <div className="flex items-center gap-3 font-mono text-[11.5px] text-muted">
      <button type="button" onClick={() => setPlaying((p) => !p)} className="w-[58px] rounded border border-line py-1 hover:text-figure">{playing ? "pause" : "play"}</button>
      {isMove ? (
        <>
          <button type="button" onClick={() => { player.current?.seek(0); setPlaying(true); }} title="replay" className="rounded border border-line px-2 py-1 hover:text-figure">↺</button>
          <input type="range" min={0} max={DURATION} step={0.01} value={time} onChange={(e) => { setPlaying(false); player.current?.seek(Number(e.target.value)); }} className="min-w-0 flex-1 accent-[#e9e4d8]" />
          <span className="w-10 text-right tabular-nums">{time.toFixed(1)}s</span>
        </>
      ) : <span className="flex-1">live shader</span>}
      {[0.5, 1, 2].map((s) => (
        <button key={s} type="button" onClick={() => setSpeed(s)} className={`rounded px-1.5 py-1 ${speed === s ? "bg-raised text-figure" : "hover:text-figure"}`}>×{s}</button>
      ))}
    </div>
  ) : null;

  const controls = <Controls params={r.params ?? []} values={values} set={set} reset={reset} extra={{ backgrounds }} />;
  const codeView = (tall?: boolean) => <CodeView tabs={out.tabs} changed={out.changed} agent={out.agent} showAll={showAll} setShowAll={setShowAll} canShowAll={isMove} onShare={share} tall={tall} />;

  return (
    <div className="mt-8">
      {/* phone: Preview / Code tabs */}
      <div className="mb-3 flex gap-1 lg:hidden">
        {(["preview", "code"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setMobileTab(v)} className={`rounded-md px-3 py-1.5 font-mono text-[12.5px] capitalize ${mobileTab === v ? "bg-figure text-ground" : "text-muted"}`}>{v}</button>
        ))}
        <span className="ml-auto self-center font-mono text-[11px] text-faint">{out.changed ? `${out.changed} changed` : ""}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`flex min-w-0 flex-col gap-4 ${mobileTab === "code" ? "max-lg:hidden" : ""}`}>
          <div className={full ? "fixed inset-0 z-[70] flex items-center justify-center bg-black p-4" : ""}>
            <div className={`relative w-full overflow-hidden ${full ? "aspect-video max-h-full max-w-[calc((100vh-2rem)*16/9)]" : "aspect-video rounded-xl border border-line bg-surface"}`}>
              {stage}
              <button type="button" onClick={() => setFull((f) => !f)} className="absolute right-3 top-3 z-10 rounded-md border border-line bg-ground/80 px-2.5 py-1 font-mono text-[11px] text-figure backdrop-blur hover:border-faint">{full ? "exit ⤡" : "⤢"}</button>
            </div>
            {full ? (
              <>
                <div className="absolute bottom-6 left-1/2 w-[min(720px,90vw)] -translate-x-1/2 rounded-lg border border-line bg-ground/80 px-3 py-2 backdrop-blur">{playback}</div>
                <div className="absolute bottom-24 right-6 top-6 w-[290px] overflow-y-auto rounded-lg border border-line bg-ground/85 p-4 backdrop-blur max-md:hidden">{controls}</div>
              </>
            ) : null}
          </div>
          {!full ? playback : null}
          <div className="lg:hidden rounded-xl border border-line bg-surface p-4">{controls}</div>
          <div className="max-lg:hidden">{codeView()}</div>
        </div>
        <aside className="max-lg:hidden">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4">{controls}</div>
        </aside>
        {mobileTab === "code" ? <div className="lg:hidden">{codeView(true)}</div> : null}
      </div>
    </div>
  );
}
