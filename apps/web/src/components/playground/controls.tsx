"use client";

import { useMemo, useState } from "react";
import FONTS from "@/data/google-fonts.json";
import { IconArrow, IconChevron, IconPlus } from "@/components/icons";

export type Param = {
  name: string; type: string; default?: unknown; options?: unknown[]; description?: string;
  min?: number; max?: number; step?: number; group?: "main" | "advanced"; control?: string; hidden?: boolean; maxItems?: number;
};
type Values = Record<string, unknown>;

const EASES = ["linear", "inSine", "outSine", "inOutSine", "inQuad", "outQuad", "inOutQuad", "inCubic", "outCubic", "inOutCubic", "inQuart", "outQuart", "inOutQuart", "inQuint", "outQuint", "inOutQuint", "inExpo", "outExpo", "inOutExpo", "inCirc", "outCirc", "inOutCirc", "outBack", "inOutBack"];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// the panel's fields: boxed, 32px tall, mono. Flush neighbours share a hairline (the focused one comes forward).
const inputCls = "box relative h-8 min-w-0 px-2 py-0 text-[12px] focus:z-10";
const numCls = `${inputCls} text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
/** A native range, squared: a 1px track and a paper block for a thumb. */
export const rangeCls = "h-5 min-w-0 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-rule [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-paper hover:[&::-webkit-slider-thumb]:bg-figure [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-rule [&::-moz-range-thumb]:h-[15px] [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper hover:[&::-moz-range-thumb]:bg-figure";
/** A native checkbox as a square switch: the block sits left when off, right (on paper) when on. */
const switchCls = "relative block h-5 w-9 shrink-0 cursor-pointer appearance-none border border-rule bg-surface before:absolute before:left-[2px] before:top-[2px] before:h-[14px] before:w-[14px] before:bg-muted before:content-[''] checked:border-paper checked:bg-paper checked:before:translate-x-4 checked:before:bg-ground";
const miniBtn = "btn btn-sm h-7 px-2";

/** The control a param gets: its explicit `control`, else one implied by its type. */
function controlOf(p: Param) {
  if (p.control) return p.control;
  if (p.type === "number") return "slider";
  if (p.type === "color") return "color";
  if (p.type === "colors") return "colors";
  if (p.type === "enum") return (p.options?.length ?? 0) > 5 ? "select" : "segmented";
  if (p.type === "boolean") return "toggle";
  if (p.type === "function") return "ease";
  if (p.type === "range") return "range";
  if (p.type === "numbers") return "numbers";
  return "text";
}

function range(p: Param) {
  const d = Number(p.default ?? 1);
  const max = p.max ?? (Math.abs(d) <= 1 ? 1 : Math.abs(d) * 3);
  const min = p.min ?? (d < 0 ? -max : 0);
  return { min, max, step: p.step ?? (max - min) / 200 };
}

function Slider({ p, value, onChange }: { p: Param; value: number; onChange: (v: number) => void }) {
  const r = range(p);
  return (
    <div className="flex items-center gap-2.5">
      <input type="range" min={r.min} max={r.max} step={r.step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`${rangeCls} flex-1`} />
      <input type="number" step={r.step} value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0} onChange={(e) => onChange(Number(e.target.value))} className={`${numCls} w-[60px] shrink-0`} />
    </div>
  );
}

/** A color with hex and alpha: #RRGGBB, or #RRGGBBAA once alpha is below 100 %. Three flush cells: swatch, hex, alpha. */
export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-f]{6}/i.test(value) ? value.slice(0, 7) : "#000000";
  const alpha = value.length === 9 ? Math.round((parseInt(value.slice(7, 9), 16) / 255) * 100) : 100;
  const withAlpha = (h: string, a: number) => (a >= 100 ? h : `${h}${Math.round((a / 100) * 255).toString(16).padStart(2, "0")}`);
  return (
    <div className="flex items-stretch">
      <input type="color" value={hex} onChange={(e) => onChange(withAlpha(e.target.value, alpha))} className="relative h-8 w-9 shrink-0 cursor-pointer appearance-none border border-rule bg-transparent p-0 focus:z-10 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-none [&::-webkit-color-swatch]:border-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} -ml-px flex-1`} />
      <input type="number" min={0} max={100} value={alpha} onChange={(e) => onChange(withAlpha(hex, Math.max(0, Math.min(100, Number(e.target.value)))))} title="alpha %" className={`${numCls} -ml-px w-[46px] shrink-0`} />
    </div>
  );
}

function ColorList({ value, onChange, max = 10 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); setOpen(j); };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {value.map((c, i) => (
          <button key={i} type="button" onClick={() => setOpen(open === i ? null : i)} title={c} aria-pressed={open === i} className={`h-7 w-7 border ${open === i ? "border-paper outline outline-1 outline-paper" : "border-rule hover:border-figure"}`} style={{ background: c }} />
        ))}
        {value.length < max ? (
          <button type="button" aria-label="Add a color" onClick={() => { onChange([...value, value[value.length - 1] ?? "#888888"]); setOpen(value.length); }} className="flex h-7 w-7 items-center justify-center border border-rule text-muted hover:border-figure hover:bg-figure hover:text-ground"><IconPlus size={12} /></button>
        ) : null}
        <span className="ml-1 font-mono text-[11px] text-faint">{value.length}/{max}</span>
      </div>
      {open !== null && value[open] !== undefined ? (
        <div className="mt-2 flex flex-col gap-2 border border-rule p-2">
          <ColorField value={value[open]} onChange={(c) => onChange(value.map((x, j) => (j === open ? c : x)))} />
          <div className="flex gap-1">
            <button type="button" aria-label="Move left" onClick={() => move(open, -1)} className={miniBtn}><IconArrow size={12} className="rotate-180" /></button>
            <button type="button" aria-label="Move right" onClick={() => move(open, 1)} className={miniBtn}><IconArrow size={12} /></button>
            {value.length > 1 ? (
              <button type="button" onClick={() => { onChange(value.filter((_, j) => j !== open)); setOpen(null); }} className={`${miniBtn} ml-auto`}>Remove</button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const fonts = FONTS as [string, string, number[], number][];
export function FontPicker({ value, onChange, role }: { value: string; onChange: (v: string) => void; role: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const list = useMemo(() => {
    const w = q.toLowerCase().trim();
    const pref = role === "mono" ? "monospace" : null;
    return fonts.filter((f) => (!w ? !pref || f[1] === pref : f[0].toLowerCase().includes(w))).slice(0, 40);
  }, [q, role]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${inputCls} flex w-full items-center justify-between gap-2 text-left hover:border-figure ${open ? "border-paper" : ""}`}>
        <span className="truncate">{value}</span><IconChevron size={11} className={`text-muted ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 -mt-px border border-paper bg-ground">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${fonts.length} Google Fonts…`} className="field px-2.5 py-2 font-mono text-[12px]" />
          <ul className="max-h-[240px] overflow-y-auto">
            {list.map((f) => (
              <li key={f[0]}>
                <button type="button" onClick={() => { onChange(f[0]); setOpen(false); setQ(""); }} className={`flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[13px] ${f[0] === value ? "bg-paper text-ground" : "text-figure hover:bg-figure hover:text-ground"}`}>
                  <span className="truncate">{f[0]}</span><span className="shrink-0 font-mono text-[11px] opacity-55">{f[1]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field({ p, value, onChange, extra }: { p: Param; value: unknown; onChange: (v: unknown) => void; extra?: { backgrounds?: string[] } }) {
  const c = controlOf(p);
  if (c === "slider") return <Slider p={p} value={Number(value)} onChange={onChange} />;
  if (c === "color") return <ColorField value={String(value ?? "#000000")} onChange={onChange} />;
  if (c === "colors") return <ColorList value={(value as string[]) ?? []} onChange={onChange} max={p.maxItems ?? 10} />;
  if (c === "toggle") return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className={switchCls} />;
  if (c === "font") return <FontPicker value={String(value)} onChange={onChange} role={p.name} />;
  if (c === "segmented") {
    // flush cells that share their hairlines, also when they wrap; the chosen one is paper
    return (
      <div className="flex flex-wrap border-l border-t border-rule">
        {(p.options as string[]).map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={`min-w-0 flex-1 whitespace-nowrap border-b border-r border-rule px-2 py-[7px] font-mono text-[11.5px] leading-none ${value === o ? "bg-paper text-ground" : "text-muted hover:bg-figure hover:text-ground"}`}>{o === "" ? "auto" : o}</button>
        ))}
      </div>
    );
  }
  if (c === "select" || c === "ease") {
    const opts = c === "ease" ? [...new Set([String(p.default), ...EASES.map((e) => `ease.${e}`)])] : p.name === "background" ? ["", ...(extra?.backgrounds ?? [])] : (p.options as string[]) ?? [];
    return (
      <div className="relative">
        <select value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${inputCls} w-full cursor-pointer appearance-none truncate pr-7 hover:border-figure`}>
          {opts.map((o) => <option key={o} value={o}>{o === "" ? "brand's first" : o}</option>)}
        </select>
        <IconChevron size={11} className="pointer-events-none absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rotate-90 text-muted" />
      </div>
    );
  }
  if (c === "range") {
    const v = (value as number[]) ?? [0, 0];
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 shrink-0 font-mono text-[11px] text-faint">{i ? "to" : "from"}</span>
            <div className="min-w-0 flex-1"><Slider p={p} value={v[i]} onChange={(x) => onChange(i ? [v[0], x] : [x, v[1]])} /></div>
          </div>
        ))}
      </div>
    );
  }
  if (c === "numbers") {
    return <input value={((value as number[]) ?? []).join(", ")} onChange={(e) => onChange(e.target.value.split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x)))} className={`${inputCls} w-full`} />;
  }
  return <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={`${inputCls} w-full`} />;
}

/** The parameters panel: ruled rows (name left, control right), "Advanced", resets and change marks. */
export function Controls({ params, values, set, reset, extra }: { params: Param[]; values: Values; set: (k: string, v: unknown) => void; reset: () => void; extra?: { backgrounds?: string[] } }) {
  const [adv, setAdv] = useState(false);
  const visible = params.filter((p) => !p.hidden);
  const main = visible.filter((p) => p.group !== "advanced");
  const rest = visible.filter((p) => p.group === "advanced");
  const anyChanged = visible.some((p) => !same(values[p.name], p.default));
  // a row: the name on the left and its control on the right; in a narrow panel the name sits above instead
  const row = (p: Param) => {
    const changed = !same(values[p.name], p.default);
    return (
      <div key={p.name} className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-b border-line py-2.5 @[300px]:grid-cols-[104px_minmax(0,1fr)] @[520px]:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center justify-between gap-2 font-mono text-[12px] leading-[18px] @[300px]:min-h-8 @[300px]:flex-col @[300px]:items-start @[300px]:justify-center @[300px]:gap-0" title={p.description}>
          <span className={`flex min-w-0 max-w-full items-center gap-1.5 ${changed ? "text-paper" : "text-muted"}`}>
            {changed ? <span className="h-1.5 w-1.5 shrink-0 bg-paper" /> : null}
            <span className="truncate">{p.name}</span>
          </span>
          {changed ? <button type="button" onClick={() => set(p.name, p.default)} className="-mx-1 shrink-0 px-1 text-[11px] leading-[16px] text-muted hover:bg-figure hover:text-ground">reset</button> : null}
        </div>
        <Field p={p} value={values[p.name]} onChange={(v) => set(p.name, v)} extra={extra} />
      </div>
    );
  };
  return (
    <div className="@container">
      <div className="flex min-h-[34px] items-end justify-between gap-3 border-b border-rule pb-3">
        <span className="font-serif text-[24px] leading-none tracking-[-0.015em] text-figure">Parameters</span>
        {anyChanged ? <button type="button" onClick={reset} className="btn btn-sm">Reset all</button> : null}
      </div>
      {visible.length ? (
        <div>
          {main.map(row)}
          {rest.length ? (
            <div>
              <button type="button" onClick={() => setAdv((a) => !a)} aria-expanded={adv} className="btn btn-sm mt-3 w-full justify-between">
                <span className="flex items-center gap-2"><IconChevron size={12} className={adv ? "rotate-90" : ""} />Advanced</span>
                <span className="font-mono text-[11px] opacity-60">{rest.length}</span>
              </button>
              {adv ? <div className="mt-3 border-t border-line">{rest.map(row)}</div> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="py-3 text-[13px] text-muted">Nothing to tune here.</p>
      )}
    </div>
  );
}
