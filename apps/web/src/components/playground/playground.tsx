"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { code as codeFor, defaults as defaultsOf, MOVE_TYPES, paramsOf, recolor } from "@/lib/customize.mjs";
import { Controls, type Param } from "./controls";
import { CodeView, copyText } from "./code-view";
import { DURATION, type PlayerHandle } from "./move-player";
import { ResourceStage } from "./resource-stage";
import { chooseRange, decodeBoard, replyLine } from "@/lib/board.mjs";
import { buildTheme, loadResource, type Res, type Theme } from "@/lib/theme";
import { IconAgent, IconCheck, IconCopy } from "@/components/icons";
import { kit } from "@/lib/kit";
import { KitButton } from "@/components/kit-button";
import { useKitTheme } from "@/lib/use-kit-theme";
import { IconCollapse, IconExpand, IconPause, IconPlay, IconReplay } from "@/components/icons";

type Values = Record<string, unknown>;
export type PlaygroundResource = {
  id: string; type: string; title: string; export?: string; signature?: string; params?: Param[];
  files: { path: string; content?: string; url?: string }[]; install: { kind: string; entry?: Record<string, unknown> };
  preview?: { video?: string; poster?: string };
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));

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
  const kitLook = useKitTheme();
  const [useTheme, setUseTheme] = useState(true);
  // opened from a board (?from=<fragment>&label=B): the board's look wins, and choosing yields the reply line
  type Board = { title: string; kind: string; reply?: string; look?: { palette?: { id: string; values?: Values }; font?: { id: string; values?: Values } }; options: { label: string; id?: string }[] };
  const [board, setBoard] = useState<{ b: Board; label: string } | null>(null);
  const [boardRes, setBoardRes] = useState<Record<string, Res>>({});
  const [reply, setReply] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search), from = q.get("from"), label = q.get("label");
    if (!from || !label) return;
    // `from` is the board's fragment, or the id of a stored board (a short link)
    const load: Promise<Board> = /^[a-z0-9]{8}$/.test(from) ? fetch(`/api/boards/${from}`).then((r) => r.json()).then((j) => j.board) : decodeBoard(from);
    load.then((b: Board) => {
      setBoard({ b, label });
      for (const it of [b.look?.palette, b.look?.font]) if (it) loadResource(it.id).then((r) => setBoardRes((x) => ({ ...x, [it.id]: r })));
    }).catch(() => {});
  }, []);
  const boardLook = useMemo(() => (board ? buildTheme(board.b.look?.palette, board.b.look?.font, boardRes) : null), [board, boardRes]);
  const theme: Theme = boardLook ?? kitLook;
  const live = theme && useTheme ? theme : null;
  const isMove = MOVE_TYPES.includes(r.type);
  const isBackground = r.type === "background";
  const key = `pm:v:${r.id}`;
  // a background in the look: its colors recolored into the palette, as values the user can still tune
  const looked = useMemo(() => (isBackground && live?.palette ? (recolor(r, live.palette) as Values) : {}), [r, isBackground, live]);
  const touched = useRef(false);

  // restore: the shared link first, then this browser's last settings
  useEffect(() => {
    try {
      const s = new URLSearchParams(location.search).get("s");
      const saved = s ? dec(s) : JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved && typeof saved === "object" && Object.keys(saved).length) { touched.current = true; setValues({ ...defaults, ...saved }); }
    } catch { /* ignore a bad link or blocked storage */ }
  }, [defaults, key]);
  // the look changes (or is toggled): recolor unless the user already tuned the values
  useEffect(() => { if (!touched.current) setValues({ ...defaults, ...looked }); }, [defaults, looked]);
  const diff = useMemo(() => Object.fromEntries(Object.entries(values).filter(([k, v]) => !same(v, defaults[k]))), [values, defaults]);
  useEffect(() => {
    try { if (Object.keys(diff).length) localStorage.setItem(key, JSON.stringify(diff)); else localStorage.removeItem(key); } catch { /* storage blocked */ }
  }, [diff, key]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = (k: string, v: unknown) => { touched.current = true; setValues((x) => ({ ...x, [k]: v })); };
  const reset = () => { touched.current = false; setValues({ ...defaults, ...looked }); };
  const out = useMemo(() => codeFor(r, values, { showAll, site }) as { tabs: { key: string; label: string; code: string }[]; changed: number; agent: string }, [r, values, showAll, site]);
  const share = async () => {
    const url = new URL(location.href);
    url.searchParams.delete("variant");
    if (Object.keys(diff).length) url.searchParams.set("s", enc(diff)); else url.searchParams.delete("s");
    return copyText(url.toString());
  };

  const stage = <ResourceStage ref={player} resource={r} values={values} theme={live} playing={playing} speed={speed} onTime={setTime} />;
  const choose = async () => {
    if (!board) return;
    const line = replyLine(board.b, { label: board.label, setArgs: (out as { setArgs?: string[] }).setArgs ?? [] });
    kit.add({ id: r.id, type: r.type, title: r.title, values: diff });
    setReply(line);
    setCopied(await copyText(line));
    // a short board: the choice also reaches the agent through the server (`pamo board --wait`)
    const from = new URLSearchParams(location.search).get("from") ?? "";
    if (/^[a-z0-9]{8}$/.test(from)) fetch(`/api/boards/${from}/choice`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ line, label: board.label }) }).catch(() => {});
  };
  const boardHref = () => { const from = new URLSearchParams(location.search).get("from") ?? ""; return /^[a-z0-9]{8}$/.test(from) ? `/b/${from}` : `/b#${from}`; };
  // a board that lets the user pick several: this tune joins the picks, and the board sends them all together
  const multiBoard = !!board && (chooseRange(board.b) as [number, number])[1] > 1;
  const addToPicks = () => {
    if (!board) return;
    const from = new URLSearchParams(location.search).get("from") ?? "", key = `pm:picks:${from.slice(0, 64)}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") ?? { labels: [], tuned: {} };
      const labels: string[] = saved.labels.includes(board.label) ? saved.labels : [...saved.labels, board.label];
      localStorage.setItem(key, JSON.stringify({ labels, tuned: { ...saved.tuned, [board.label]: diff } }));
    } catch { /* storage blocked: the board will not remember this tune */ }
    location.href = boardHref();
  };

  const playback = isMove || r.type === "background" ? (
    <div className="flex items-center gap-3 font-mono text-[11.5px] text-muted">
      <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-figure hover:border-faint">{playing ? <IconPause size={14} /> : <IconPlay size={14} />}</button>
      {isMove ? (
        <>
          <button type="button" onClick={() => { player.current?.seek(0); setPlaying(true); }} aria-label="Replay" className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-figure hover:border-faint"><IconReplay size={14} /></button>
          <input type="range" min={0} max={DURATION} step={0.01} value={time} onChange={(e) => { setPlaying(false); player.current?.seek(Number(e.target.value)); }} className="min-w-0 flex-1 accent-[#e9e4d8]" />
          <span className="w-10 text-right tabular-nums">{time.toFixed(1)}s</span>
        </>
      ) : <span className="flex-1">live shader</span>}
      {[0.5, 1, 2].map((s) => (
        <button key={s} type="button" onClick={() => setSpeed(s)} className={`rounded px-1.5 py-1 ${speed === s ? "bg-raised text-figure" : "hover:text-figure"}`}>×{s}</button>
      ))}
    </div>
  ) : null;

  const controls = <Controls params={paramsOf(r) as Param[]} values={values} set={set} reset={reset} extra={{ backgrounds }} />;
  const codeView = (tall?: boolean) => <CodeView tabs={out.tabs} changed={out.changed} agent={out.agent} showAll={showAll} setShowAll={setShowAll} canShowAll={isMove} onShare={share} tall={tall} />;

  return (
    <div className="mt-8">
      {board ? (
        <div className="mb-5 rounded-lg border border-paper/40 bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-muted"><IconAgent size={15} className="text-paper" /> Tuning option <b className="text-figure">{board.label}</b> of “{board.b.title}”. Adjust, then choose it.</span>
            <a href={boardHref()} className="text-muted underline decoration-faint underline-offset-4 hover:text-figure">Back to the board</a>
          </div>
          {reply ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-figure">{reply}</code>
              <button type="button" onClick={async () => setCopied(await copyText(reply))} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[11.5px] text-muted hover:text-figure">{copied ? <IconCheck size={12} /> : <IconCopy size={12} />}{copied ? "copied, paste it in the chat" : "copy"}</button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[13px] text-muted">{out.changed ? `${out.changed} setting${out.changed > 1 ? "s" : ""} tuned` : "Tune it, then add it to your kit"}</span>
          {(isMove || (isBackground && theme?.palette)) && theme ? (
            <button type="button" onClick={() => setUseTheme((u) => !u)} className={`flex items-center gap-2 truncate rounded-full border px-2.5 py-1 text-[12px] ${useTheme ? "border-paper text-paper" : "border-line text-muted"}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: theme.vars["--pm-a"] ?? "#e9e4d8" }} />
              {useTheme ? (isBackground ? `In your palette · ${theme.label}` : `In your kit's look · ${theme.label}`) : isBackground ? "Recolor to my palette" : "Show in my kit's look"}
            </button>
          ) : null}
        </div>
        {board ? (
          <button type="button" onClick={multiBoard ? addToPicks : choose} className="flex items-center gap-2 rounded-md bg-paper px-3.5 py-2 text-[13px] font-medium text-ground hover:bg-figure"><IconCheck size={15} /> {multiBoard ? `Keep ${board.label} like this, back to the board` : `Choose ${board.label}, like this`}</button>
        ) : <KitButton id={r.id} type={r.type} title={r.title} values={diff} variant="solid" />}
      </div>
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
              <button type="button" onClick={() => setFull((f) => !f)} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-ground/80 text-figure backdrop-blur hover:border-faint">{full ? <IconCollapse size={14} /> : <IconExpand size={14} />}</button>
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
