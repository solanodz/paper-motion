"use client";
// The kit's palette and font pair as the theme live previews use.
import { useEffect, useMemo, useState } from "react";
import { kitTheme, useKit } from "@/lib/kit";
import { buildTheme, loadResource, type Res, type Theme } from "@/lib/theme";

export type { Theme };

export function useKitTheme(): Theme {
  const k = useKit();
  const { palette, font } = kitTheme(k);
  const [res, setRes] = useState<Record<string, Res>>({});
  useEffect(() => {
    for (const it of [palette, font]) if (it && !res[it.id]) loadResource(it.id).then((r) => setRes((x) => ({ ...x, [it.id]: r })));
  }, [palette, font, res]);
  return useMemo(() => buildTheme(palette, font, res), [palette, font, res]);
}
