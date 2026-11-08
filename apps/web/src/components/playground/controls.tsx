"use client";

import { useMemo, useState } from "react";
import FONTS from "@/data/google-fonts.json";
import { IconChevron } from "@/components/icons";

export type Param = {
  name: string; type: string; default?: unknown; options?: unknown[]; description?: string;
  min?: number; max?: number; step?: number; group?: "main" | "advanced"; control?: string; hidden?: boolean; maxItems?: number;
};
type Values = Record<string, unknown>;

const EASES = ["linear", "inSine", "outSine", "inOutSine", "inQuad", "outQuad", "inOutQuad", "inCubic", "outCubic", "inOutCubic", "inQuart", "outQuart", "inOutQuart", "inQuint", "outQuint", "inOutQuint", "inExpo", "outExpo", "inOutExpo", "inCirc", "outCirc", "inOutCirc", "outBack", "inOutBack"];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const inputCls = "rounded border border-line bg-surface px-2 py-1 font-mono text-[11.5px] text-figure outline-none focus:border-faint";

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
    <div className="flex items-center gap-2">
      <input type="range" min={r.min} max={r.max} step={r.step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 accent-[#e9e4d8]" />
      <input type="number" step={r.step} value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0} onChange={(e) => onChange(Number(e.target.value))} className={`${inputCls} w-[72px]`} />
    </div>
  );
}

/** A color with hex and alpha: #RRGGBB, or #RRGGBBAA once alpha is below 100 %. */
export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-f]{6}/i.test(value) ? value.slice(0, 7) : "#000000";
  const alpha = value.length === 9 ? Math.round((parseInt(value.slice(7, 9), 16) / 255) * 100) : 100;
  const withAlpha = (h: string, a: number) => (a >= 100 ? h : `${h}${Math.round((a / 100) * 255).toString(16).padStart(2, "0")}`);
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={hex} onChange={(e) => onChange(withAlpha(e.target.value, alpha))} className="h-7 w-9 shrink-0 cursor-pointer rounded border border-line bg-transparent" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} min-w-0 flex-1`} />
      <input type="number" min={0} max={100} value={alpha} onChange={(e) => onChange(withAlpha(hex, Math.max(0, Math.min(100, Number(e.target.value)))))} title="alpha %" className={`${inputCls} w-[52px]`} />
    </div>
  );
}

function ColorList({ value, onChange, max = 10 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); setOpen(j); };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((c, i) => (
          <button key={i} type="button" onClick={() => setOpen(open === i ? null : i)} title={c} className={`h-8 w-8 rounded border ${open === i ? "border-figure" : "border-line"}`} style={{ background: c }} />
        ))}
        {value.length < max ? (
          <button type="button" onClick={() => { onChange([...value, value[value.length - 1] ?? "#888888"]); setOpen(value.length); }} className="h-8 w-8 rounded border border-dashed border-line text-muted hover:text-figure">+</button>
        ) : null}
        <span className="font-mono text-[10.5px] text-faint">{value.length}/{max}</span>
      </div>
      {open !== null && value[open] !== undefined ? (
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-line p-2">
          <ColorField value={value[open]} onChange={(c) => onChange(value.map((x, j) => (j === open ? c : x)))} />
          <div className="flex gap-1 font-mono text-[11px]">
            <button type="button" onClick={() => move(open, -1)} className="rounded border border-line px-2 py-0.5 text-muted hover:text-figure">←</button>
            <button type="button" onClick={() => move(open, 1)} className="rounded border border-line px-2 py-0.5 text-muted hover:text-figure">→</button>
            {value.length > 1 ? (
              <button type="button" onClick={() => { onChange(value.filter((_, j) => j !== open)); setOpen(null); }} className="ml-auto rounded border border-line px-2 py-0.5 text-muted hover:text-figure">remove</button>
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
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputCls} flex w-full items-center justify-between text-left`}>
        <span className="truncate">{value}</span><span className="text-faint">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-line bg-raised p-2 shadow-2xl">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${fonts.length} Google Fonts…`} className={`${inputCls} mb-2 w-full`} />
          <ul className="max-h-[240px] overflow-y-auto">
            {list.map((f) => (
              <li key={f[0]}>
                <button type="button" onClick={() => { onChange(f[0]); setOpen(false); setQ(""); }} className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[13px] hover:bg-surface ${f[0] === value ? "text-paper" : "text-figure"}`}>
                  <span className="truncate">{f[0]}</span><span className="font-mono text-[10px] text-faint">{f[1]}</span>
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
  if (c === "toggle") return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  if (c === "font") return <FontPicker value={String(value)} onChange={onChange} role={p.name} />;
  if (c === "segmented") {
    return (
      <div className="flex flex-wrap gap-1">
        {(p.options as string[]).map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} className={`rounded px-2 py-1 font-mono text-[11px] ${value === o ? "bg-figure text-ground" : "border border-line text-muted hover:text-figure"}`}>{o === "" ? "auto" : o}</button>
        ))}
      </div>
    );
  }
  if (c === "select" || c === "ease") {
    const opts = c === "ease" ? [...new Set([String(p.default), ...EASES.map((e) => `ease.${e}`)])] : p.name === "background" ? ["", ...(extra?.backgrounds ?? [])] : (p.options as string[]) ?? [];
    return (
      <select value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${inputCls} w-full`}>
        {opts.map((o) => <option key={o} value={o}>{o === "" ? "brand's first" : o}</option>)}
      </select>
    );
  }
  if (c === "range") {
    const v = (value as number[]) ?? [0, 0];
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 font-mono text-[10.5px] text-faint">{i ? "to" : "from"}</span>
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

/** The parameters panel: main controls, "Advanced", resets and change marks. */
export function Controls({ params, values, set, reset, extra }: { params: Param[]; values: Values; set: (k: string, v: unknown) => void; reset: () => void; extra?: { backgrounds?: string[] } }) {
  const [adv, setAdv] = useState(false);
  const visible = params.filter((p) => !p.hidden);
  const main = visible.filter((p) => p.group !== "advanced");
  const rest = visible.filter((p) => p.group === "advanced");
  const anyChanged = visible.some((p) => !same(values[p.name], p.default));
  const row = (p: Param) => {
    const changed = !same(values[p.name], p.default);
    return (
      <div key={p.name}>
        <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11.5px]" title={p.description}>
          <span className={`truncate ${changed ? "text-paper" : "text-muted"}`}>{changed ? "● " : ""}{p.name}</span>
          {changed ? <button type="button" onClick={() => set(p.name, p.default)} className="shrink-0 text-faint hover:text-figure">reset</button> : null}
        </div>
        <Field p={p} value={values[p.name]} onChange={(v) => set(p.name, v)} extra={extra} />
      </div>
    );
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-medium text-figure">Parameters</span>
        {anyChanged ? <button type="button" onClick={reset} className="font-mono text-[11px] text-faint hover:text-figure">reset all</button> : null}
      </div>
      {visible.length ? (
        <div className="flex flex-col gap-4">
          {main.map(row)}
          {rest.length ? (
            <div>
              <button type="button" onClick={() => setAdv((a) => !a)} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-figure">
                <IconChevron size={12} className={`transition-transform ${adv ? "rotate-90" : ""}`} /> Advanced <span className="font-mono text-[11px] text-faint">{rest.length}</span>
              </button>
              {adv ? <div className="mt-4 flex flex-col gap-4">{rest.map(row)}</div> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-[13px] text-muted">Nothing to tune here.</p>
      )}
    </div>
  );
}
