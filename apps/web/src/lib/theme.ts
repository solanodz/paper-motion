// A look (a palette and a font pair, each with values) as the --pm-* variables the live demos read.
// Pure: the kit hook and the board page both build their theme here.
import { apply, defaults } from "@/lib/customize.mjs";

export type Pick = { id: string; values?: Record<string, unknown>; title?: string };
export type Res = { id: string; type: string; title?: string; params?: { name: string; default?: unknown }[]; install: { entry?: Record<string, unknown> }; files: unknown[] };
export type Theme = { vars: Record<string, string>; links: string[]; label: string; palette?: Record<string, string> } | null;

const cache: Record<string, Promise<Res>> = {};
export const loadResource = (id: string) => (cache[id] ??= fetch(`/r/${id}.json`).then((r) => r.json()));

export function buildTheme(palette: Pick | undefined, font: Pick | undefined, res: Record<string, Res>): Theme {
  if (!palette && !font) return null;
  const vars: Record<string, string> = {}, links: string[] = [], label: string[] = [];
  let pal: Record<string, string> | undefined;
  if (palette && res[palette.id]) {
    const r = res[palette.id], v = { ...defaults(r), ...palette.values } as Record<string, string>;
    pal = v;
    Object.assign(vars, { "--pm-g": v.ground, "--pm-f": v.figure, "--pm-m": v.muted, "--pm-s": v.surface, "--pm-a": v.accent, "--pm-l": `color-mix(in oklab, ${v.figure} 16%, ${v.ground})` });
    label.push(palette.title ?? r.title ?? palette.id);
  }
  if (font && res[font.id]) {
    const r = res[font.id], e = (apply(r, { ...defaults(r), ...font.values }) as { install: { entry: { fonts: Record<string, { family: string; css?: string }> } } }).install.entry;
    vars["--pm-display"] = `'${e.fonts.display.family}'`;
    vars["--pm-mono"] = `'${e.fonts.mono.family}'`;
    links.push(...new Set(Object.values(e.fonts).map((f) => f.css).filter(Boolean) as string[]));
    label.push(font.title ?? r.title ?? font.id);
  }
  return Object.keys(vars).length ? { vars, links, label: label.join(" · "), palette: pal } : null;
}
