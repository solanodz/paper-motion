"use client";

import { forwardRef, useMemo } from "react";
import { apply } from "@/lib/customize.mjs";
import type { Theme } from "@/lib/theme";
import { ShaderPreview } from "@/components/shader-preview";
import { MovePlayer, type PlayerHandle } from "./move-player";

type Values = Record<string, unknown>;
export type StageResource = { id: string; type: string; params?: { name: string; default?: unknown }[]; install: { kind: string; entry?: Record<string, unknown> }; files: unknown[]; preview?: { video?: string; poster?: string } };
const MOVES = ["component", "transition", "text", "camera"];
const WARN = "#ff4d2e"; // the system's warn, for a contrast that falls short

const ratio = (a: string, b: string) => {
  const l = (h: string) => { const n = parseInt(h.slice(1, 7), 16); const v = [n >> 16 & 255, n >> 8 & 255, n & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const [x, y] = [l(a), l(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05);
};

/** One contrast reading on a palette: the pair, its ratio, and a red block when it falls short. */
function Contrast({ name, value, min, color }: { name: string; value: number; min: number; color: string }) {
  const low = value < min;
  return (
    <span className="flex items-center gap-2" style={{ color: low ? WARN : color }}>
      <span>{name}</span>
      <span className="tabular-nums">{value.toFixed(1)}:1</span>
      {low ? <span className="px-1.5 py-0.5 text-black" style={{ background: WARN }}>low</span> : null}
    </span>
  );
}

export function PalettePreview({ entry, compact = false }: { entry: { colors: Record<string, { hex: string }>; ramp: string[] }; compact?: boolean }) {
  const c = entry.colors, fig = ratio(c.figure.hex, c.ground.hex), mut = ratio(c.muted.hex, c.ground.hex);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: c.ground.hex }}>
      <div className="flex flex-1 flex-col justify-center px-[6%]">
        <div className="font-serif leading-none tracking-[-0.03em]" style={{ color: c.figure.hex, fontSize: compact ? "clamp(28px,5cqw,56px)" : "clamp(40px,7vw,104px)" }}>Every frame.</div>
        <div className="mt-3 max-w-[46ch]" style={{ color: c.muted.hex, fontSize: compact ? "clamp(11px,1.6cqw,14px)" : "clamp(13px,1.4vw,18px)" }}>Secondary text in muted. The accent is for <span style={{ color: c.accent.hex }}>one moment</span>.</div>
        {!compact ? (
          <>
            <div className="mt-6 flex w-fit max-w-full items-stretch font-mono text-[12px]" style={{ border: `1px solid ${c.surface.hex}` }}>
              <span className="px-3 py-2.5" style={{ background: c.surface.hex, color: c.figure.hex }}>surface</span>
              <span className="truncate px-3 py-2.5" style={{ color: c.muted.hex }}>a card or a panel</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px]">
              <Contrast name="figure" value={fig} min={7} color={c.muted.hex} />
              <Contrast name="muted" value={mut} min={3} color={c.muted.hex} />
            </div>
          </>
        ) : null}
      </div>
      <div className="flex h-[16%]">{(entry.ramp ?? []).map((h, i) => <div key={i} className="flex-1" style={{ background: h }} />)}</div>
    </div>
  );
}

export function FontPreview({ entry, compact = false }: { entry: { fonts: Record<string, { family: string; css?: string }>; type: { display: { weight: number; tracking: string } } }; compact?: boolean }) {
  const f = entry.fonts, links = [...new Set(Object.values(f).map((x) => x.css).filter(Boolean) as string[])];
  return (
    <div className="flex h-full w-full flex-col justify-center bg-raised px-[6%]">
      {links.map((href) => <link key={href} rel="stylesheet" href={href} />)}
      <div className="truncate leading-[0.95]" style={{ fontFamily: `'${f.display.family}'`, fontWeight: entry.type.display.weight, letterSpacing: entry.type.display.tracking, fontSize: compact ? "clamp(30px,7cqw,64px)" : "clamp(44px,8vw,120px)" }}>Make it move.</div>
      <p className="mt-4 max-w-[52ch] text-muted" style={{ fontFamily: `'${f.text.family}'`, fontSize: compact ? "clamp(11px,1.8cqw,15px)" : "clamp(14px,1.5vw,20px)" }}>Body text for captions and lines that explain.</p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-muted" style={{ fontFamily: `'${f.mono.family}'`, fontSize: compact ? "clamp(9px,1.3cqw,12px)" : "clamp(11px,1vw,14px)" }}>
        <span>{f.display.family}</span><span>{f.text.family}</span><span>{f.mono.family}</span>
      </p>
    </div>
  );
}

/**
 * A resource at given values, live: moves through the player, backgrounds as shaders, palettes and fonts as
 * specimens, recipes from their clip. `theme` is the look the demo plays in (the kit's, or a board's).
 */
export const ResourceStage = forwardRef<PlayerHandle, {
  resource: StageResource; values: Values; theme?: Theme; playing?: boolean; speed?: number; compact?: boolean; onTime?: (t: number) => void;
}>(function ResourceStage({ resource: r, values, theme, playing = true, speed = 1, compact = false, onTime }, ref) {
  const entry = useMemo(() => (apply(r, values) as { install: { entry?: Record<string, unknown> } }).install.entry, [r, values]);
  const remountKey = JSON.stringify(["seed", "separator", "from", "to"].map((k) => (r.type === "text" ? values[k] : null)));
  const links = theme?.links.map((href) => <link key={href} rel="stylesheet" href={href} />) ?? null;
  if (MOVES.includes(r.type)) return <>{links}<MovePlayer ref={ref} id={r.id} values={values} playing={playing} speed={speed} remountKey={remountKey} theme={theme?.vars ?? null} onTime={onTime} /></>;
  if (r.type === "background" && entry) {
    const props = { ...(entry.props as Values), speed: playing ? Number((entry.props as Values).speed ?? 1) * speed : 0 };
    return <ShaderPreview key={JSON.stringify((entry.props as Values).colors ?? "")} entry={{ ...(entry as { shader: string }), props }} className="h-full w-full" />;
  }
  if (r.type === "palette" && entry) return <PalettePreview entry={entry as never} compact={compact} />;
  if (r.type === "font-pair" && entry) return <FontPreview entry={entry as never} compact={compact} />;
  if (r.preview?.video) return <video src={`/${r.preview.video}`} poster={r.preview.poster ? `/${r.preview.poster}` : undefined} autoPlay muted loop playsInline className="block h-full w-full bg-black object-cover" />;
  return null;
});
