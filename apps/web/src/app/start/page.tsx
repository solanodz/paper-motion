import type { Metadata } from "next";
import { getIndex, getResource } from "@/lib/registry";
import { Quiz, type QuizData } from "./quiz";

export const metadata: Metadata = { title: "Start from zero" };

/** The data the quiz needs, trimmed on the server: palettes, font pairs, backgrounds' colors, moves, recipes. */
function data(): QuizData {
  const { items } = getIndex();
  const pick = (type: string) => items.filter((i) => i.type === type);
  return {
    recipes: pick("recipe").map((i) => ({ id: i.id, title: i.title, summary: i.summary, poster: i.preview?.poster ?? null })),
    palettes: pick("palette").map((i) => {
      const e = getResource(i.id)!.install.entry as { colors: Record<string, { hex: string }>; ramp: string[]; mode: string };
      return { id: i.id, title: i.title, mode: e.mode, colors: Object.fromEntries(Object.entries(e.colors).map(([k, v]) => [k, v.hex])), ramp: e.ramp, tags: i.tags };
    }),
    fonts: pick("font-pair").map((i) => {
      const e = getResource(i.id)!.install.entry as { fonts: Record<string, { family: string; css: string }> };
      return { id: i.id, title: i.title, display: e.fonts.display.family, text: e.fonts.text.family, css: e.fonts.display.css, textCss: e.fonts.text.css, tags: i.tags };
    }),
    backgrounds: pick("background").filter((i) => !i.tags.includes("image")).map((i) => {
      const e = getResource(i.id)!.install.entry as { shader: string; props: Record<string, unknown>; background?: string };
      const cols = [...((e.props.colors as string[]) ?? []), e.props.colorBack, e.props.colorFront, e.background].filter((c): c is string => typeof c === "string" && /^#[0-9a-f]{6}/i.test(c));
      return { id: i.id, title: i.title, colors: cols.map((c) => c.slice(0, 7)), tags: i.tags, entry: e };
    }),
    moves: items.filter((i) => ["component", "transition", "text", "camera"].includes(i.type)).map((i) => ({ id: i.id, title: i.title, type: i.type, poster: i.preview?.poster ?? null })),
  };
}

export default function StartPage() {
  return <Quiz data={data()} />;
}
