"use client";
// The kit's palette and font pair as the theme live previews use (--pm-* variables on the demo stage).
import { useEffect, useMemo, useState } from "react";
import { apply, defaults } from "@/lib/customize.mjs";
import { kitTheme, useKit } from "@/lib/kit";

type Res = { id: string; type: string; params?: { name: string; default?: unknown }[]; install: { entry?: Record<string, unknown> }; files: unknown[] };
const cache: Record<string, Promise<Res>> = {};
const load = (id: string) => (cache[id] ??= fetch(`/r/${id}.json`).then((r) => r.json()));

export type Theme = { vars: Record<string, string>; links: string[]; label: string } | null;

export function useKitTheme(): Theme {
  const k = useKit();
  const { palette, font } = kitTheme(k);
  const [res, setRes] = useState<Record<string, Res>>({});
  useEffect(() => {
    for (const it of [palette, font]) if (it && !res[it.id]) load(it.id).then((r) => setRes((x) => ({ ...x, [it.id]: r })));
  }, [palette, font, res]);
  return useMemo(() => {
    if (!palette && !font) return null;
    const vars: Record<string, string> = {}, links: string[] = [], label: string[] = [];
    if (palette && res[palette.id]) {
      const r = res[palette.id], v = { ...defaults(r), ...palette.values } as Record<string, string>;
      Object.assign(vars, { "--pm-g": v.ground, "--pm-f": v.figure, "--pm-m": v.muted, "--pm-s": v.surface, "--pm-a": v.accent, "--pm-l": `color-mix(in oklab, ${v.figure} 16%, ${v.ground})` });
      label.push(palette.title);
    }
    if (font && res[font.id]) {
      const r = res[font.id], e = (apply(r, { ...defaults(r), ...font.values }) as { install: { entry: { fonts: Record<string, { family: string; css?: string }> } } }).install.entry;
      vars["--pm-display"] = `'${e.fonts.display.family}'`;
      vars["--pm-mono"] = `'${e.fonts.mono.family}'`;
      links.push(...new Set(Object.values(e.fonts).map((f) => f.css).filter(Boolean) as string[]));
      label.push(font.title);
    }
    return Object.keys(vars).length ? { vars, links, label: label.join(" · ") } : null;
  }, [palette, font, res]);
}
