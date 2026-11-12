"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { code as codeFor, defaults as defaultsOf, MOVE_TYPES, paramsOf, recolor } from "@/lib/customize.mjs";
import { Controls, rangeCls, type Param } from "./controls";
import { CodeView, copyText } from "./code-view";
import { DURATION, type PlayerHandle } from "./move-player";
import { ResourceStage } from "./resource-stage";
import { chooseRange, decodeBoard, replyLine } from "@/lib/board.mjs";
import { buildTheme, loadResource, type Res, type Theme } from "@/lib/theme";
import { IconAgent, IconArrow, IconCheck, IconCopy } from "@/components/icons";
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

/**
 * A resource's playground, "Inspector" layout: the stage and its transport in one frame (the corner marks), the
 * parameters as a ruled column beside it, the code below.
 */
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

  // the transport: a strip of flush cells under the stage (on a phone the speeds drop to a strip of their own)
  const transportBtn = "flex h-10 w-10 shrink-0 items-center justify-center border-r border-line text-figure hover:bg-figure hover:text-ground";
  const playback = isMove || r.type === "background" ? (
    <div className="flex flex-wrap items-stretch font-mono text-[12px] text-muted">
      <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className={transportBtn}>{playing ? <IconPause size={14} /> : <IconPlay size={14} />}</button>
      {isMove ? (
        <>
          <button type="button" onClick={() => { player.current?.seek(0); setPlaying(true); }} aria-label="Replay" className={transportBtn}><IconReplay size={14} /></button>
          <div className="flex h-10 min-w-0 flex-1 items-center px-3"><input type="range" min={0} max={DURATION} step={0.01} value={time} onChange={(e) => { setPlaying(false); player.current?.seek(Number(e.target.value)); }} aria-label="Time" className={`${rangeCls} w-full`} /></div>
          <span className="flex h-10 w-[52px] shrink-0 items-center justify-end border-l border-line px-2.5 tabular-nums text-figure">{time.toFixed(1)}s</span>
        </>
      ) : <span className="flex h-10 min-w-0 flex-1 items-center px-3">Live shader</span>}
      <div className="flex max-sm:basis-full max-sm:border-t max-sm:border-line">
        {[0.5, 1, 2].map((s) => (
          <button key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s} className={`h-10 border-l border-line max-sm:flex-1 max-sm:first:border-l-0 sm:w-11 ${speed === s ? "bg-paper text-ground" : "hover:bg-figure hover:text-ground"}`}>×{s}</button>
        ))}
      </div>
    </div>
  ) : null;

  const controls = <Controls params={paramsOf(r) as Param[]} values={values} set={set} reset={reset} extra={{ backgrounds }} />;
  const codeView = (tall?: boolean) => <CodeView tabs={out.tabs} changed={out.changed} agent={out.agent} showAll={showAll} setShowAll={setShowAll} canShowAll={isMove} onShare={share} tall={tall} />;

  return (
    <div className="mt-10">
      {board ? (
        <div className="mb-6 border border-l-[5px] border-paper">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 text-[14px]">
            <span className="flex min-w-0 items-start gap-2.5 text-muted"><IconAgent size={16} className="mt-0.5 shrink-0 text-paper" /><span>Tuning option <b className="font-medium text-figure">{board.label}</b> of “{board.b.title}”. Adjust, then choose it.</span></span>
            <a href={boardHref()} className="btn btn-sm"><IconArrow size={13} className="rotate-180" />Back to the board</a>
          </div>
          {reply ? (
            <div className="code flex border-x-0 border-b-0 max-sm:flex-col sm:items-stretch">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-figure">{reply}</code>
              <button type="button" onClick={async () => setCopied(await copyText(reply))} className={`btn btn-sm shrink-0 border-line max-sm:border-x-0 max-sm:border-b-0 sm:border-y-0 sm:border-r-0 ${copied ? "btn-primary" : ""}`}>{copied ? <IconCheck size={13} /> : <IconCopy size={13} />}{copied ? "Copied, paste it in the chat" : "Copy"}</button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          {out.changed ? <span className="tag tag-paper">{out.changed} setting{out.changed > 1 ? "s" : ""} tuned</span> : <span className="text-[14px] text-muted">Tune it, then add it to your kit</span>}
          {(isMove || (isBackground && theme?.palette)) && theme ? (
            <button type="button" onClick={() => setUseTheme((u) => !u)} aria-pressed={useTheme} className={`btn btn-sm min-w-0 max-w-full ${useTheme ? "border-paper hover:border-figure" : ""}`}>
              <span className="h-2.5 w-2.5 shrink-0 border border-current" style={{ background: theme.vars["--pm-a"] ?? "#e9e4d8" }} />
              <span className="truncate">{useTheme ? (isBackground ? "In your palette" : "In your kit's look") : isBackground ? "Recolor to my palette" : "Show in my kit's look"}</span>
              {/* which palette and fonts, each in a cell of its own */}
              {useTheme ? theme.label.split(" · ").map((l, i) => <span key={i} className="truncate border-l border-current pl-2 font-mono text-[11px] opacity-70">{l}</span>) : null}
            </button>
          ) : null}
        </div>
        {board ? (
          <button type="button" onClick={multiBoard ? addToPicks : choose} className="btn btn-primary max-w-full"><IconCheck size={15} /><span className="min-w-0 truncate">{multiBoard ? `Keep ${board.label} like this, back to the board` : `Choose ${board.label}, like this`}</span></button>
        ) : <KitButton id={r.id} type={r.type} title={r.title} values={diff} variant="solid" />}
      </div>
      {/* phone: Preview / Code as two flush cells */}
      <div className="mb-5 flex h-10 items-stretch border border-line text-[13px] lg:hidden">
        {(["preview", "code"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setMobileTab(v)} aria-pressed={mobileTab === v} className={`cell flex-1 justify-center capitalize first:border-l-0 ${mobileTab === v ? "cell-on" : ""}`}>{v}</button>
        ))}
        {out.changed ? <span className="cell px-3 font-mono text-[12px]">{out.changed} changed</span> : null}
      </div>

      <div className="grid gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-x-8">
        <div className={`flex min-w-0 flex-col gap-7 ${mobileTab === "code" ? "max-lg:hidden" : ""}`}>
          <div className={full ? "fixed inset-0 z-[70] flex items-center justify-center bg-black p-4" : "corner-marks"}>
            <div className={`relative w-full overflow-hidden ${full ? "aspect-video max-h-full max-w-[calc((100vh-2rem)*16/9)]" : "aspect-video border border-line bg-surface"}`}>
              {stage}
              <button type="button" onClick={() => setFull((f) => !f)} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center border-b border-l border-line bg-ground text-figure hover:bg-figure hover:text-ground">{full ? <IconCollapse size={14} /> : <IconExpand size={14} />}</button>
            </div>
            {full ? (
              <>
                {playback ? <div className="absolute bottom-6 left-1/2 w-[min(720px,90vw)] -translate-x-1/2 border border-rule bg-ground">{playback}</div> : null}
                <div className="absolute bottom-24 right-6 top-6 w-[340px] overflow-y-auto border border-rule bg-ground p-4 max-md:hidden">{controls}</div>
              </>
            ) : playback ? <div className="border border-t-0 border-line">{playback}</div> : null}
          </div>
          <div className="lg:hidden">{controls}</div>
          <div className="max-lg:hidden">{codeView()}</div>
        </div>
        <aside className="border-l border-line max-lg:hidden">
          <div className="sticky top-[52px] max-h-[calc(100vh-52px)] overflow-y-auto py-4 pl-4 pr-1 xl:pl-5">{controls}</div>
        </aside>
        {mobileTab === "code" ? <div className="lg:hidden">{codeView(true)}</div> : null}
      </div>
    </div>
  );
}
