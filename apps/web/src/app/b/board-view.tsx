"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chooseRange, decodeBoard, replyLine } from "@/lib/board.mjs";
import { recolor, setArgs } from "@/lib/customize.mjs";
import { kit } from "@/lib/kit";
import { buildTheme, loadResource, type Res, type Theme } from "@/lib/theme";
import { ResourceStage } from "@/components/playground/resource-stage";
import { BeatsStrip, type Beat } from "@/components/beats-strip";
import { copyText } from "@/components/playground/code-view";
import { IconAgent, IconArrow, IconCheck, IconCopy, IconKit, TYPE_ICONS } from "@/components/icons";

type Values = Record<string, unknown>;
type Pick = { id: string; values?: Values };
type Structure = { title: string; duration: number; beats: Beat[] };
type Option = { label: string; id?: string; values?: Values; items?: Pick[]; note?: string; structure?: Structure };
type Board = { v: number; kind: "resource" | "kit"; title: string; ask?: string; reply?: string; look?: { palette?: Pick; font?: Pick }; choose?: number | [number, number]; options: Option[] };
type Full = Res & { title: string; type: string; summary?: string; install: { kind: string; entry?: Record<string, unknown> }; preview?: { video?: string; poster?: string } };

const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** An option's values in the look: a background is recolored into the look's palette first, the agent's values on top. */
const inLook = (res: Full | undefined, values: Values | undefined, theme: Theme): Values =>
  res?.type === "background" && theme?.palette ? { ...(recolor(res, theme.palette) as Values), ...(values ?? {}) } : values ?? {};

/** One option of a resource board: its live stage, label, note and the two actions. */
function ResourceOption({ o, res, theme, fragment, chosen, multi, tuned, onChoose }: { o: Option; res: Full | undefined; theme: Theme; fragment: string; chosen: boolean; multi: boolean; tuned?: Values; onChoose: () => void }) {
  const Icon = res ? TYPE_ICONS[res.type] : null;
  const values = tuned ?? inLook(res, o.values, theme);
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition-colors ${chosen ? "border-paper" : "border-line"}`}>
      <div className="relative aspect-video overflow-hidden bg-black [container-type:inline-size]">
        {res ? <ResourceStage resource={res} values={values} theme={theme} compact /> : null}
        <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-md bg-ground/80 px-2 font-mono text-[13px] text-figure backdrop-blur">{o.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={14} className="text-paper" /> : null}
          <span className="truncate text-[15px] font-medium">{res?.title ?? o.id}</span>
          <code className="ml-auto shrink-0 font-mono text-[11px] text-faint">{o.id}</code>
        </div>
        {o.note ? <p className="mt-2 text-[13px] leading-snug text-muted">{o.note}</p> : null}
        {o.values && Object.keys(o.values).length ? <p className="mt-1.5 font-mono text-[11px] text-faint">{Object.keys(o.values).length} setting{Object.keys(o.values).length > 1 ? "s" : ""} adjusted by your agent</p> : null}
        {res?.type === "recipe" && (res as { beats?: Beat[] }).beats?.length ? <div className="mt-3"><BeatsStrip beats={(res as { beats?: Beat[] }).beats!} duration={(res as { duration?: number }).duration} compact /></div> : null}
        {res?.type === "background" && theme?.palette ? <p className="mt-1.5 font-mono text-[11px] text-faint">recolored to your palette</p> : null}
        {tuned ? <p className="mt-1.5 font-mono text-[11px] text-paper">tuned by you</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onChoose} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium ${chosen ? "bg-raised text-paper" : "bg-paper text-ground hover:bg-figure"}`}>
            {chosen ? <IconCheck size={14} /> : null}{multi ? (chosen ? "Picked" : `Pick ${o.label}`) : chosen ? "Chosen" : `Choose ${o.label}`}
          </button>
          <Link href={`/r/${o.id}?from=${encodeURIComponent(fragment)}&label=${o.label}${Object.keys(values).length ? `&s=${enc(values)}` : ""}`} className="rounded-md border border-line px-3 py-2 text-[13px] text-figure hover:border-faint">Tune</Link>
        </div>
      </div>
    </div>
  );
}

/** An option that is a structure the agent proposes for this brief, instead of a recipe: its beats, built from scratch if chosen. */
function StructureOption({ o, chosen, multi, onChoose }: { o: Option; chosen: boolean; multi: boolean; onChoose: () => void }) {
  const st = o.structure!;
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition-colors ${chosen ? "border-paper" : "border-line"}`}>
      <div className="relative flex aspect-video flex-col justify-end overflow-hidden bg-black p-4">
        <BeatsStrip beats={st.beats} duration={st.duration} compact />
        <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-md bg-ground/80 px-2 font-mono text-[13px] text-figure backdrop-blur">{o.label}</span>
        <span className="absolute right-3 top-3 rounded-md bg-ground/80 px-2 py-1 font-mono text-[11px] text-muted backdrop-blur">a structure for this brief · {st.duration} s</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2"><IconAgent size={14} className="text-paper" /><span className="truncate text-[15px] font-medium">{st.title}</span></div>
        <ul className="mt-2 space-y-1 text-[12.5px] text-muted">{st.beats.map((b) => <li key={b.name + b.from}><span className="font-mono text-[11px] text-faint">{b.from}–{b.to} s</span> <span className="text-figure">{b.name}</span> · {b.what}</li>)}</ul>
        {o.note ? <p className="mt-2 text-[13px] leading-snug text-muted">{o.note}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onChoose} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium ${chosen ? "bg-raised text-paper" : "bg-paper text-ground hover:bg-figure"}`}>
            {chosen ? <IconCheck size={14} /> : null}{multi ? (chosen ? "Picked" : `Pick ${o.label}`) : chosen ? "Chosen" : `Choose ${o.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** One option of a kit board: a sheet with the background behind a headline in the pair, the palette strip, the names. */
function KitOption({ o, res, chosen, multi, onChoose }: { o: Option; res: Record<string, Full>; chosen: boolean; multi: boolean; onChoose: () => void }) {
  const items = o.items ?? [];
  const by = (t: string) => items.filter((i) => res[i.id]?.type === t);
  const pal = by("palette")[0], font = by("font-pair")[0], bg = by("background")[0], recipe = by("recipe")[0];
  const theme = useMemo(() => buildTheme(pal, font, res), [pal, font, res]);
  const c = theme?.palette;
  const moves = items.filter((i) => ["component", "transition", "text", "camera"].includes(res[i.id]?.type ?? ""));
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition-colors ${chosen ? "border-paper" : "border-line"}`}>
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: c?.ground ?? "#000" }}>
        {theme?.links.map((href) => <link key={href} rel="stylesheet" href={href} />)}
        {bg && res[bg.id] ? <div className="absolute inset-0 opacity-90"><ResourceStage resource={res[bg.id]} values={inLook(res[bg.id], bg.values, theme)} compact /></div> : null}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span className="leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: theme?.vars["--pm-display"], color: c?.figure ?? "#fff", fontSize: "clamp(26px,6cqw,52px)", fontWeight: 600 }}>Your brand, moving.</span>
          {c ? <span className="mt-3 flex h-2 w-full max-w-[200px] overflow-hidden rounded-sm">{[c.ground, c.surface, c.muted, c.figure, c.accent].map((h, i) => <span key={i} className="flex-1" style={{ background: h }} />)}</span> : null}
        </div>
        <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-md bg-ground/80 px-2 font-mono text-[13px] text-figure backdrop-blur">{o.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {o.note ? <p className="text-[13px] leading-snug text-muted">{o.note}</p> : null}
        <ul className="mt-3 flex flex-col gap-1 text-[13px]">
          {[pal, font, bg, ...moves, recipe].filter((i): i is Pick => !!i).map((i) => { const r = res[i.id], Icon = r ? TYPE_ICONS[r.type] : null; return <li key={i.id} className="flex items-center gap-2"><span className="w-4 text-paper">{Icon ? <Icon size={13} /> : null}</span><span className="truncate">{r?.title ?? i.id}</span><code className="ml-auto font-mono text-[10.5px] text-faint">{i.id}</code></li>; })}
        </ul>
        <button type="button" onClick={onChoose} className={`mt-4 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium ${chosen ? "bg-raised text-paper" : "bg-paper text-ground hover:bg-figure"}`}>
          {chosen ? <IconCheck size={14} /> : <IconKit size={14} />}{multi ? (chosen ? "Picked" : `Pick kit ${o.label}`) : chosen ? "Chosen" : `Choose kit ${o.label}`}
        </button>
      </div>
    </div>
  );
}

export function BoardView({ short = false }: { short?: boolean } = {}) {
  // a short link's id comes from the URL in the browser (not from a hook: the page prerenders as a static shell)
  const [id, setId] = useState<string | undefined>(undefined);
  useEffect(() => { if (short) setId(location.pathname.split("/").filter(Boolean).pop() ?? ""); }, [short]);
  const [fragment, setFragment] = useState("");
  const [sent, setSent] = useState<boolean | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Record<string, Full>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [tuned, setTuned] = useState<Record<string, Values>>({});
  // picks survive a trip to the playground (Tune) in this browser: { labels, tuned: { [label]: values } }
  const picksKey = () => `pm:picks:${id ?? fragment.slice(0, 64)}`;
  useEffect(() => {
    if (!board) return;
    try { const saved = JSON.parse(localStorage.getItem(picksKey()) ?? "null"); if (saved) { setPicked(saved.labels ?? []); setTuned(saved.tuned ?? {}); } } catch { /* ignore */ }
  }, [board]); // eslint-disable-line react-hooks/exhaustive-deps
  const savePicks = (labels: string[], t: Record<string, Values>) => { try { if (labels.length || Object.keys(t).length) localStorage.setItem(picksKey(), JSON.stringify({ labels, tuned: t })); else localStorage.removeItem(picksKey()); } catch { /* ignore */ } };
  const [reply, setReply] = useState<string | null>(null);
  const [none, setNone] = useState(false);
  const [noneText, setNoneText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (short && id === undefined) return;   // the id is read on the client first
    // a short link (/b/<id>) loads the stored board; a long one carries it in the fragment
    if (id) {
      setFragment(id);
      fetch(`/api/boards/${id}`).then(async (r) => {
        if (r.status === 404) throw new Error("this board expired or was forgotten");
        if (!r.ok) throw new Error(`the server answered ${r.status}`);
        return (await r.json()).board as Board;
      }).then((b) => { setBoard(b); setError(null); }).catch((e: Error) => setError(e.message));
      return;
    }
    const read = () => {
      const f = location.hash.slice(1);
      setFragment(f);
      if (!f) { setError("empty"); return; }
      decodeBoard(f).then((b: Board) => { setBoard(b); setError(null); setChosen(null); setPicked([]); setReply(null); }).catch((e: Error) => setError(e.message));
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [id, short]);
  useEffect(() => {
    if (!board) return;
    const ids = new Set<string>();
    for (const o of board.options) { if (o.id) ids.add(o.id); for (const i of o.items ?? []) ids.add(i.id); }
    for (const l of [board.look?.palette, board.look?.font]) if (l) ids.add(l.id);
    for (const id of ids) if (!res[id]) loadResource(id).then((r) => setRes((x) => ({ ...x, [id]: r as Full })));
  }, [board, res]);
  const theme = useMemo(() => (board ? buildTheme(board.look?.palette, board.look?.font, res) : null), [board, res]);

  // the line reaches the agent two ways: pasted by the user, and (short links) stored for `pamo board --wait`
  const say = async (line: string, meta: { label?: string; labels?: string[]; none?: boolean; text?: string } = {}) => {
    setReply(line); setSent(null);
    setCopied(await copyText(line));
    if (id) fetch(`/api/boards/${id}/choice`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ line, ...meta }) }).then((r) => setSent(r.ok)).catch(() => setSent(false));
  };
  const choose = (o: Option) => {
    if (!board) return;
    setNone(false); setChosen(o.label);
    if (board.kind === "kit") {
      const pick = (t: string) => (o.items ?? []).find((i) => res[i.id]?.type === t);
      const t = buildTheme(pick("palette"), pick("font-pair"), res);
      const items = (o.items ?? []).map((i) => ({ id: i.id, type: res[i.id]?.type ?? "", title: res[i.id]?.title ?? i.id, values: inLook(res[i.id], i.values, t) }));
      kit.set({ name: kit.get().name, items });
      say(replyLine(board, { label: o.label }), { label: o.label });
    } else if (o.structure) {
      say(replyLine(board, { label: o.label }), { label: o.label });
    } else {
      const r = res[o.id!], values = inLook(r, o.values, theme);
      if (r) kit.add({ id: r.id, type: r.type, title: r.title, values });
      say(replyLine(board, { label: o.label, setArgs: r ? (setArgs(r, { ...Object.fromEntries((r.params ?? []).map((p) => [p.name, p.default])), ...values }) as string[]) : [] }), { label: o.label });
    }
  };
  const sayNone = () => { if (!board) return; setChosen(null); setPicked([]); say(replyLine(board, { none: true, text: noneText.trim() }), { none: true, text: noneText.trim() }); };
  // boards with choose > 1: picks accumulate, then one "Send to my agent" sends them all as one line
  const [lo, hi] = board ? (chooseRange(board) as [number, number]) : [1, 1];
  const multi = hi > 1;
  const togglePick = (o: Option) => { setNone(false); setPicked((p) => { const next = p.includes(o.label) ? p.filter((l) => l !== o.label) : p.length >= hi ? p : [...p, o.label]; savePicks(next, tuned); return next; }); };
  const sendPicks = () => {
    if (!board || picked.length < lo) return;
    const opts = board.options.filter((o) => picked.includes(o.label));
    if (board.kind === "kit") {
      const o = opts[0], pick = (t: string) => (o.items ?? []).find((i) => res[i.id]?.type === t), t = buildTheme(pick("palette"), pick("font-pair"), res);
      kit.set({ name: kit.get().name, items: (o.items ?? []).map((i) => ({ id: i.id, type: res[i.id]?.type ?? "", title: res[i.id]?.title ?? i.id, values: inLook(res[i.id], i.values, t) })) });
      say(replyLine(board, { picks: opts.map((x) => ({ label: x.label })) }), { labels: opts.map((x) => x.label) });
      return;
    }
    const picks = opts.map((o) => {
      if (o.structure) return { label: o.label, setArgs: [] };
      const r = res[o.id!], values = tuned[o.label] ?? inLook(r, o.values, theme);
      if (r) kit.add({ id: r.id, type: r.type, title: r.title, values });
      return { label: o.label, setArgs: r ? (setArgs(r, { ...Object.fromEntries((r.params ?? []).map((p) => [p.name, p.default])), ...values }) as string[]) : [] };
    });
    say(replyLine(board, { picks }), { labels: opts.map((x) => x.label) });
    try { localStorage.removeItem(picksKey()); } catch { /* ignore */ }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-24 text-center md:px-8">
        <IconAgent size={28} className="mx-auto text-paper" />
        <h1 className="mt-5 font-serif text-[40px] leading-none tracking-[-0.02em]">{error === "empty" ? "No board in this link." : "This board can't be read."}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{error === "empty" ? "A board is a link your agent builds so you can compare options. Ask it to propose something, or browse the library." : `The link seems cut or changed (${error}). Ask your agent to share it again.`}</p>
        <Link href="/library" className="mt-8 inline-flex items-center gap-2 text-[14px] text-figure underline decoration-faint underline-offset-4">Open the library <IconArrow size={14} /></Link>
      </div>
    );
  }
  if (!board) return <div className="px-5 py-24 text-center font-mono text-[13px] text-faint">Opening the board…</div>;

  const cols = board.options.length <= 2 ? "md:grid-cols-2" : board.options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4";
  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-muted"><IconAgent size={15} className="text-paper" /> Your agent proposes{board.reply ? <code className="font-mono text-[11px] text-faint">· {board.reply}</code> : null}</div>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.02em] md:text-[56px]">{board.title}</h1>
          {board.ask ? <p className="mt-3 text-[17px] text-muted">{board.ask}</p> : null}
        </div>
        {theme ? (
          <div className="flex items-center gap-3 rounded-full border border-line py-1.5 pl-2 pr-4 text-[12.5px] text-muted">
            {theme.palette ? <span className="flex overflow-hidden rounded-full">{[theme.palette.ground, theme.palette.surface, theme.palette.figure, theme.palette.accent].map((h, i) => <span key={i} className="h-5 w-5" style={{ background: h }} />)}</span> : null}
            <span>Shown in your look · {theme.label}</span>
          </div>
        ) : null}
      </div>

      <div className={`mt-10 grid gap-5 ${cols}`}>
        {board.options.map((o) => (board.kind === "kit"
          ? <KitOption key={o.label} o={o} res={res} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} onChoose={() => (multi ? togglePick(o) : choose(o))} />
          : o.structure ? <StructureOption key={o.label} o={o} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} onChoose={() => (multi ? togglePick(o) : choose(o))} />
          : <ResourceOption key={o.label} o={o} res={o.id ? res[o.id] : undefined} theme={theme} fragment={fragment} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} tuned={tuned[o.label]} onChoose={() => (multi ? togglePick(o) : choose(o))} />))}
      </div>
      {multi ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4">
          <span className="text-[14px] text-muted">{picked.length ? `${picked.length} picked` : "Pick what you like"} · {lo === hi ? `choose ${hi}` : `${lo} to ${hi}`}</span>
          <button type="button" onClick={sendPicks} disabled={picked.length < lo} className="ml-auto flex items-center gap-2 rounded-md bg-paper px-4 py-2 text-[13.5px] font-medium text-ground hover:bg-figure disabled:cursor-not-allowed disabled:opacity-40"><IconAgent size={15} /> Send to my agent</button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!none ? <button type="button" onClick={() => { setNone(true); setReply(null); }} className="text-[13.5px] text-muted underline decoration-faint underline-offset-4 hover:text-figure">None of these</button> : (
          <div className="flex w-full max-w-[640px] gap-2">
            <input autoFocus value={noneText} onChange={(e) => setNoneText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sayNone(); }} placeholder="What would you rather see? (optional)" className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[14px] text-figure outline-none placeholder:text-faint focus:border-faint" />
            <button type="button" onClick={sayNone} className="rounded-md border border-line px-3.5 py-2 text-[13px] text-figure hover:border-faint">Tell my agent</button>
          </div>
        )}
      </div>

      {reply ? (
        <div className="corner-marks mt-8 rounded-xl border border-paper/50 bg-surface p-5">
          {id && sent !== false ? (
            <>
              <div className="flex items-center gap-2 text-[15px] font-medium">{sent ? <IconCheck size={16} className="text-paper" /> : <span className="h-2 w-2 animate-pulse rounded-full bg-paper" />} {sent ? "Sent to your agent." : "Sending to your agent…"}</div>
              <p className="mt-2 text-[13.5px] text-muted">{sent ? "If it is waiting, it already has your choice and keeps going. You can close this tab." : "One moment."}</p>
              <details className="mt-3 text-[13px] text-muted">
                <summary className="cursor-pointer hover:text-figure">If your agent was not waiting, paste this line in the chat</summary>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-ground px-3 py-2 font-mono text-[13px] text-figure">{reply}</code>
                  <button type="button" onClick={async () => setCopied(await copyText(reply))} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[12.5px] text-figure hover:border-faint"><IconCopy size={13} /> {copied ? "Copied" : "Copy"}</button>
                </div>
              </details>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[14px] font-medium"><IconCheck size={16} className="text-paper" /> {sent === false ? "The site could not be reached. Paste this line in the chat with your agent:" : copied ? "Copied. Paste this line in the chat with your agent:" : "Paste this line in the chat with your agent:"}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-ground px-3 py-2 font-mono text-[13px] text-figure">{reply}</code>
                <button type="button" onClick={async () => setCopied(await copyText(reply))} className="flex items-center gap-1.5 rounded-md bg-paper px-3 py-2 text-[12.5px] font-medium text-ground hover:bg-figure"><IconCopy size={13} /> Copy</button>
              </div>
            </>
          )}
          {chosen || picked.length ? <p className="mt-3 text-[13px] text-muted">It is also in <Link href="/kit" className="text-figure underline decoration-faint underline-offset-4">your kit</Link>, where every choice adds up.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
