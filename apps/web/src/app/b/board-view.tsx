"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { chooseRange, decodeBoard, replyLine } from "@/lib/board.mjs";
import { recolor, setArgs } from "@/lib/customize.mjs";
import { kit } from "@/lib/kit";
import { buildTheme, loadResource, type Res, type Theme } from "@/lib/theme";
import { ResourceStage } from "@/components/playground/resource-stage";
import { BeatsStrip, type Beat } from "@/components/beats-strip";
import { ScriptPlayer } from "@/components/script-player";
import { ClipReel, type Segment } from "@/components/clip-reel";
import { composeScripts } from "@/lib/compose";
import { copyText } from "@/components/playground/code-view";
import { IconAgent, IconArrow, IconCheck, IconCopy, IconKit, TYPE_ICONS } from "@/components/icons";

type Values = Record<string, unknown>;
type Pick = { id: string; values?: Values };
type Structure = { title: string; duration: number; beats: Beat[] };
type Option = { label: string; id?: string; values?: Values; items?: Pick[]; note?: string; structure?: Structure };
type Board = { v: number; kind: "resource" | "kit"; title: string; ask?: string; reply?: string; look?: { palette?: Pick; font?: Pick }; choose?: number | [number, number]; options: Option[] };
type Full = Res & { title: string; type: string; summary?: string; install: { kind: string; entry?: Record<string, unknown> }; preview?: { video?: string; poster?: string } };

const MOVE_TYPES = ["component", "transition", "text", "camera", "background", "palette", "font-pair"];
const enc = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** An option's values in the look: a background is recolored into the look's palette first, the agent's values on top. */
const inLook = (res: Full | undefined, values: Values | undefined, theme: Theme): Values =>
  res?.type === "background" && theme?.palette ? { ...(recolor(res, theme.palette) as Values), ...(values ?? {}) } : values ?? {};

const SCRIPTED = ["recipe", "shot", "block"];

/**
 * The bar under an option's picture: the letter it is called by as a pixel numeral, then what it is. Once chosen
 * (or picked) the whole bar is a paper block with black type.
 */
function Caption({ label, chosen, multi, icon, title, children }: { label: string; chosen: boolean; multi: boolean; icon?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className={`flex items-stretch border-y ${chosen ? "border-paper bg-paper text-ground" : "border-line"}`}>
      <span className={`num flex w-[60px] shrink-0 items-center justify-center border-r text-[40px] ${chosen ? "border-ground text-ground" : "border-line text-figure"}`}>{label}</span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon ? <span className={`shrink-0 ${chosen ? "" : "text-paper"}`}>{icon}</span> : null}
          <span className="truncate text-[16px] font-medium leading-tight">{title}</span>
        </div>
        {children ? <div className={`flex items-center gap-3 font-mono text-[11.5px] leading-none ${chosen ? "" : "text-muted"}`}>{children}</div> : null}
      </div>
      {chosen ? <span className="flex w-11 shrink-0 items-center justify-center border-l border-ground"><IconCheck size={18} /><span className="sr-only">{multi ? "Picked" : "Chosen"}</span></span> : null}
    </div>
  );
}

/** The one thing to do with an option: paper until it is done, an outline that says so after. */
function ChooseButton({ label, chosen, multi, kit = false, onChoose }: { label: string; chosen: boolean; multi: boolean; kit?: boolean; onChoose: () => void }) {
  return (
    <button type="button" onClick={onChoose} className={`btn min-w-0 flex-1 py-3 text-[14px] ${chosen ? "" : "btn-primary"}`}>
      {chosen ? <IconCheck size={15} /> : kit ? <IconKit size={15} /> : null}{multi ? (chosen ? "Picked" : `Pick ${kit ? "kit " : ""}${label}`) : chosen ? "Chosen" : `Choose ${kit ? "kit " : ""}${label}`}
    </button>
  );
}

/** A cell of the contact sheet: the option's picture in the look, its caption bar, then what is said about it. */
const cellClass = (chosen: boolean) => `flex flex-col bg-ground ${chosen ? "relative z-10 outline-paper" : ""}`;
const Fact = ({ children }: { children: ReactNode }) => <li className="border-b border-line py-2 font-mono text-[11.5px] leading-snug text-muted">{children}</li>;

/** One option of a resource board: its live stage, its letter and name, the note, and the two actions. */
function ResourceOption({ o, res, theme, fragment, chosen, multi, tuned, onChoose }: { o: Option; res: Full | undefined; theme: Theme; fragment: string; chosen: boolean; multi: boolean; tuned?: Values; onChoose: () => void }) {
  const Icon = res ? TYPE_ICONS[res.type] : null;
  const values = tuned ?? inLook(res, o.values, theme);
  const beats = res && SCRIPTED.includes(res.type) ? (res as { beats?: Beat[] }).beats : undefined;
  const duration = (res as { duration?: number } | undefined)?.duration;
  const adjusted = o.values ? Object.keys(o.values).length : 0;
  const facts: ReactNode[] = [];
  if (adjusted) facts.push(<Fact key="adjusted">{adjusted} setting{adjusted > 1 ? "s" : ""} adjusted by your agent</Fact>);
  if (res?.type === "background" && theme?.palette) facts.push(<Fact key="recolored">Recolored to your palette</Fact>);
  if (res?.preview?.video && !MOVE_TYPES.includes(res.type) && theme) facts.push(<Fact key="sample">A sample render. Yours is built in your look.</Fact>);
  if (tuned) facts.push(<li key="tuned" className="border-b border-line py-2"><span className="tag tag-paper">Tuned by you</span></li>);
  return (
    <article className={cellClass(chosen)}>
      <div className="relative aspect-video overflow-hidden bg-black [container-type:inline-size]">
        {res && beats?.length && !res.preview?.video
          ? <ScriptPlayer beats={beats} duration={duration} theme={theme} title={res.title} compact />
          : res ? <ResourceStage resource={res} values={values} theme={theme} compact /> : null}
      </div>
      <Caption label={o.label} chosen={chosen} multi={multi} icon={Icon ? <Icon size={15} /> : null} title={res?.title ?? o.id}>
        <code className="truncate">{o.id}</code>
      </Caption>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {o.note ? <p className="text-[14px] leading-snug text-muted">{o.note}</p> : null}
        {beats?.length ? <BeatsStrip beats={beats} duration={duration} compact /> : null}
        {facts.length ? <ul className="border-t border-line">{facts}</ul> : null}
        <div className="mt-auto flex gap-2">
          <ChooseButton label={o.label} chosen={chosen} multi={multi} onChoose={onChoose} />
          <Link href={`/r/${o.id}?from=${encodeURIComponent(fragment)}&label=${o.label}${Object.keys(values).length ? `&s=${enc(values)}` : ""}`} className="btn px-5 py-3 text-[14px]">Tune</Link>
        </div>
      </div>
    </article>
  );
}

/** A structure's beats as reel segments: a beat that names a block, shot or recipe plays its clip. */
const beatSegments = (beats: Beat[], res: Record<string, Full>): Segment[] =>
  beats.map((b) => ({ name: b.name, what: b.what, seconds: Math.max(0.5, b.to - b.from), src: b.id && res[b.id]?.preview?.video ? `/${res[b.id].preview!.video}` : undefined }));


/** An option that is a structure the agent proposes for this brief, instead of a recipe: its beats, built from scratch if chosen. */
function StructureOption({ o, res, theme, chosen, multi, onChoose }: { o: Option; res: Record<string, Full>; theme: Theme; chosen: boolean; multi: boolean; onChoose: () => void }) {
  const st = o.structure!;
  const segments = beatSegments(st.beats, res);
  return (
    <article className={cellClass(chosen)}>
      <div className="relative aspect-video overflow-hidden bg-black">
        {segments.some((x) => x.src) ? <ClipReel segments={segments} theme={theme} /> : <ScriptPlayer beats={st.beats} duration={st.duration} theme={theme} title={st.title} compact />}
      </div>
      <Caption label={o.label} chosen={chosen} multi={multi} icon={<IconAgent size={15} />} title={st.title}>
        <span className="truncate">A structure for this brief</span><span className="ml-auto shrink-0">{st.duration} s</span>
      </Caption>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {o.note ? <p className="text-[14px] leading-snug text-muted">{o.note}</p> : null}
        <BeatsStrip beats={st.beats} duration={st.duration} />
        <div className="mt-auto flex">
          <ChooseButton label={o.label} chosen={chosen} multi={multi} onChoose={onChoose} />
        </div>
      </div>
    </article>
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
  const listed = [pal, font, bg, ...moves, recipe].filter((i): i is Pick => !!i);
  return (
    <article className={cellClass(chosen)}>
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: c?.ground ?? "#000" }}>
        {theme?.links.map((href) => <link key={href} rel="stylesheet" href={href} />)}
        {bg && res[bg.id] ? <div className="absolute inset-0 opacity-90"><ResourceStage resource={res[bg.id]} values={inLook(res[bg.id], bg.values, theme)} compact /></div> : null}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span className="leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: theme?.vars["--pm-display"], color: c?.figure ?? "#fff", fontSize: "clamp(26px,6cqw,52px)", fontWeight: 600 }}>Your brand, moving.</span>
          {c ? <span className="mt-3 flex h-2 w-full max-w-[200px] overflow-hidden">{[c.ground, c.surface, c.muted, c.figure, c.accent].map((h, i) => <span key={i} className="flex-1" style={{ background: h }} />)}</span> : null}
        </div>
      </div>
      <Caption label={o.label} chosen={chosen} multi={multi} icon={<IconKit size={15} />} title="Kit">
        <span>{listed.length} resource{listed.length === 1 ? "" : "s"}</span>
      </Caption>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {o.note ? <p className="text-[14px] leading-snug text-muted">{o.note}</p> : null}
        <ul className="border-t border-line text-[13px]">
          {listed.map((i) => { const r = res[i.id], Icon = r ? TYPE_ICONS[r.type] : null; return <li key={i.id} className="flex items-center gap-2.5 border-b border-line py-2"><span className="flex w-4 shrink-0 text-paper">{Icon ? <Icon size={14} /> : null}</span><span className="min-w-0 flex-1 truncate">{r?.title ?? i.id}</span><code className="shrink-0 font-mono text-[11px] text-faint">{i.id}</code></li>; })}
        </ul>
        <div className="mt-auto flex">
          <ChooseButton label={o.label} chosen={chosen} multi={multi} kit onChoose={onChoose} />
        </div>
      </div>
    </article>
  );
}

/** The line that goes back to the agent, in a code block, with its copy action flush under it. */
function ReplyLine({ line, label, primary = false, onCopy }: { line: string; label: string; primary?: boolean; onCopy: () => void }) {
  return (
    <div className="code border-0 border-t">
      <code className="block px-4 py-3 text-figure [overflow-wrap:anywhere]">{line}</code>
      <button type="button" onClick={onCopy} className={`btn w-full ${primary ? "btn-primary" : "border-0 border-t border-line"}`}><IconCopy size={14} /> {label}</button>
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
    for (const o of board.options) { if (o.id) ids.add(o.id); for (const i of o.items ?? []) ids.add(i.id); for (const b of o.structure?.beats ?? []) if (b.id) ids.add(b.id); }
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
  // recipes picked in order become one script: the sequence the agent will build
  const sequence = useMemo(() => {
    if (!board || !multi || picked.length < 2) return null;
    const parts = picked.map((l) => board.options.find((o) => o.label === l)).filter(Boolean).map((o) => (o!.structure ? { ...o!.structure } : o!.id && (res[o!.id]?.type === "recipe" || res[o!.id]?.type === "shot" || res[o!.id]?.type === "block") ? { id: o!.id, video: res[o!.id].preview?.video, title: res[o!.id].title, duration: (res[o!.id] as { duration?: number }).duration, beats: (res[o!.id] as { beats?: Beat[] }).beats } : null)).filter(Boolean) as { id?: string; video?: string; title?: string; duration?: number; beats?: Beat[] }[];
    if (parts.length < 2 || !parts.every((p) => p.beats?.length)) return null;
    const segments: Segment[] = parts.flatMap((p) => (p.video ? [{ name: p.title ?? p.id ?? "", what: "", seconds: p.duration ?? Math.max(...p.beats!.map((b) => b.to)), src: `/${p.video}` }] : beatSegments(p.beats!, res)));
    return { ...composeScripts(parts), segments };
  }, [board, multi, picked, res]);
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
      <div className="mx-auto w-full max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
        <p className="flex items-center gap-2 text-[13px] text-muted"><IconAgent size={15} className="text-paper" /> A board from your agent</p>
        <h1 className="display mt-4 max-w-[14ch] text-[length:clamp(40px,6vw,88px)]">{error === "empty" ? "No board in this link." : "This board can't be read."}</h1>
        <p className="mt-6 max-w-[54ch] text-[16px] leading-relaxed text-muted">{error === "empty" ? "A board is a link your agent builds so you can compare options. Ask it to propose something, or browse the library." : `The link seems cut or changed (${error}). Ask your agent to share it again.`}</p>
        <Link href="/library" className="btn mt-8">Open the library <IconArrow size={14} /></Link>
      </div>
    );
  }
  if (!board) return <div className="mx-auto w-full max-w-[1600px] px-5 py-24 font-mono text-[13px] text-muted md:px-8">Opening the board…</div>;

  const n = board.options.length;
  const cols = n <= 2 ? "md:grid-cols-2" : n === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 2xl:grid-cols-4";
  const range = lo === hi ? `choose ${hi}` : `${lo} to ${hi}`;
  // the decision column's top edge carries its state, as the studio's does
  const edge = !reply ? "border-t-rule" : sent ? "border-t-ok" : sent === false ? "border-t-warn" : "border-t-paper";
  return (
    <div className="mx-auto w-full max-w-[1600px] border-line min-[1601px]:border-x">
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        {/* the question, and the options as a contact sheet */}
        <div className="min-w-0 xl:pb-20">
          <header className="px-5 pb-8 pt-10 md:px-8 md:pb-10 md:pt-14">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted"><span className="flex items-center gap-2"><IconAgent size={15} className="text-paper" /> Your agent proposes</span>{board.reply ? <code className="tag">{board.reply}</code> : null}</p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
              <h1 className="display min-w-0 max-w-[20ch] text-balance break-words text-[length:clamp(40px,6vw,88px)]">{board.title}</h1>
              {board.ask ? <p className="max-w-[38ch] pb-1 text-[16px] leading-snug text-muted">{board.ask}</p> : null}
            </div>
          </header>

          {theme ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-5 py-3 text-[13px] text-muted md:px-8">
              {theme.palette ? <span className="flex border border-rule">{[theme.palette.ground, theme.palette.surface, theme.palette.figure, theme.palette.accent].map((h, i) => <span key={i} className="h-4 w-4" style={{ background: h }} />)}</span> : null}
              <span>Shown in your look</span>
              {theme.label.split(" · ").map((name) => <span key={name} className="tag">{name}</span>)}
            </div>
          ) : null}

          <div className={`sheet grid-cols-1 ${cols}`}>
            {board.options.map((o) => (board.kind === "kit"
              ? <KitOption key={o.label} o={o} res={res} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} onChoose={() => (multi ? togglePick(o) : choose(o))} />
              : o.structure ? <StructureOption key={o.label} o={o} res={res} theme={theme} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} onChoose={() => (multi ? togglePick(o) : choose(o))} />
              : <ResourceOption key={o.label} o={o} res={o.id ? res[o.id] : undefined} theme={theme} fragment={fragment} chosen={multi ? picked.includes(o.label) : chosen === o.label} multi={multi} tuned={tuned[o.label]} onChoose={() => (multi ? togglePick(o) : choose(o))} />))}
          </div>

          {multi && sequence ? (
            <section className="mt-12 border-t border-rule">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 py-5 md:px-8">
                <div className="min-w-0">
                  <p className="text-[13px] text-muted">Your sequence</p>
                  <h2 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-[28px] leading-none tracking-[-0.02em]">
                    {sequence.title.split(" → ").map((part, k) => <span key={k} className="flex items-center gap-3">{k ? <IconArrow size={18} className="text-muted" /> : null}{part}</span>)}
                  </h2>
                </div>
                <span className="tag">{+sequence.segments.reduce((a, x) => a + x.seconds, 0).toFixed(1)} s</span>
              </div>
              <div className="sheet grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-video bg-black">{sequence.segments.some((x) => x.src) ? <ClipReel segments={sequence.segments} theme={theme} /> : <ScriptPlayer beats={sequence.beats} duration={sequence.duration} theme={theme} title="sequence" compact />}</div>
                <ol className="text-[13.5px]">
                  {sequence.segments.map((x, k) => (
                    <li key={k} className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line px-4 py-3 last:border-b-0">
                      <span className="num text-[18px]">{String(k + 1).padStart(2, "0")}</span>
                      <span className="flex min-w-0 flex-wrap gap-x-2 leading-snug"><span className="text-figure">{x.name}</span>{x.what ? <span className="text-muted">{x.what}</span> : null}</span>
                      <span className="font-mono text-[11.5px] text-faint">{+x.seconds.toFixed(1)} s</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}
        </div>

        {/* your decision, beside the work */}
        <aside className={`flex flex-col gap-7 border-t-4 px-5 pb-16 pt-7 md:px-8 xl:sticky xl:top-[52px] xl:h-[calc(100dvh-52px)] xl:overflow-y-auto xl:border-l xl:border-l-line xl:px-6 ${edge} ${multi ? "xl:pb-24" : "xl:pb-10"}`}>
          <div>
            <h2 className="font-serif text-[34px] leading-[0.98] tracking-[-0.02em]">{reply ? (chosen ? `You chose ${chosen}` : "Your answer") : multi ? (lo === hi ? `Pick ${hi}` : `Pick ${lo} to ${hi}`) : "Choose one"}</h2>
            {!reply ? <p className="mt-3 text-[14px] leading-snug text-muted">{multi ? "Pick what you like, then send them to your agent as one line." : "Compare them playing. Your choice goes back to your agent as one line."}</p> : null}
          </div>

          {reply ? (
            <div className={`border ${sent ? "border-ok" : sent === false ? "border-warn" : "border-paper"}`}>
              {id && sent !== false ? (
                <>
                  <div className={`flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium text-ground ${sent ? "bg-ok" : "bg-paper"}`}>{sent ? <IconCheck size={16} /> : <span className="h-2 w-2 animate-pulse bg-ground motion-reduce:animate-none" />} {sent ? "Sent to your agent." : "Sending to your agent…"}</div>
                  <p className="px-4 py-3 text-[13.5px] leading-snug text-muted">{sent ? "If it is waiting, it already has your choice and keeps going. You can close this tab." : "One moment."}</p>
                  <details className="border-t border-line text-[13px] text-muted">
                    <summary className="cursor-pointer px-4 py-3 leading-snug hover:bg-figure hover:text-ground">If your agent was not waiting, paste this line in the chat</summary>
                    <ReplyLine line={reply} label={copied ? "Copied" : "Copy"} onCopy={async () => setCopied(await copyText(reply))} />
                  </details>
                </>
              ) : (
                <>
                  <div className={`flex items-start gap-2.5 px-4 py-3 text-[14px] font-medium leading-snug text-ground ${sent === false ? "bg-warn" : "bg-paper"}`}><IconCheck size={16} className="mt-0.5 shrink-0" /> {sent === false ? "The site could not be reached. Paste this line in the chat with your agent:" : copied ? "Copied. Paste this line in the chat with your agent:" : "Paste this line in the chat with your agent:"}</div>
                  <ReplyLine line={reply} label="Copy" primary onCopy={async () => setCopied(await copyText(reply))} />
                </>
              )}
              {chosen || picked.length ? <p className="border-t border-line px-4 py-3 text-[13px] leading-snug text-muted">It is also in <Link href="/kit" className="text-figure underline decoration-rule underline-offset-4 hover:decoration-figure">your kit</Link>, where every choice adds up.</p> : null}
            </div>
          ) : null}

          <div className="border-t border-rule pt-5">
            {!none ? <button type="button" onClick={() => { setNone(true); setReply(null); }} className="btn">None of these</button> : (
              <div className="flex flex-col gap-2">
                <input autoFocus value={noneText} onChange={(e) => setNoneText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sayNone(); }} placeholder="What would you rather see? (optional)" className="box w-full font-sans text-[14px]" />
                <button type="button" onClick={sayNone} className="btn w-full">Tell my agent</button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* boards that take several picks: what is picked so far, and the one send */}
      {multi ? (
        <div className="sticky bottom-0 z-30 flex flex-wrap items-stretch border-t border-rule bg-ground">
          <span className="flex min-h-[52px] items-center px-4 text-[13px] sm:text-[14px] md:px-8">{picked.length ? `${picked.length} picked` : "Pick what you like"}</span>
          <span className="flex items-center border-l border-line px-3 font-mono text-[12px] text-muted sm:px-4">{range}</span>
          <span className="flex min-h-[52px] flex-1 items-stretch border-l border-line">
            {Array.from({ length: Math.max(hi, picked.length) }, (_, k) => <span key={k} className={`num flex w-9 items-center justify-center border-r text-[24px] sm:w-11 ${picked[k] ? "border-ground bg-paper text-ground" : "border-line"}`}>{picked[k] ?? ""}</span>)}
          </span>
          <button type="button" onClick={sendPicks} disabled={picked.length < lo} className="btn btn-primary min-h-[52px] border-0 px-6 text-[14px] max-sm:w-full"><IconAgent size={15} /> Send to my agent</button>
        </div>
      ) : null}
    </div>
  );
}
