// Reads the published registry (public/registry.json and public/r/<id>.json), which `npm run registry`
// builds from ../../registry. Server-only: pages read it at build time.
import fs from "node:fs";
import path from "node:path";

export type ResourceType = "component" | "transition" | "text" | "camera" | "background" | "palette" | "font-pair" | "recipe";

export type Param = { name: string; type: string; default?: unknown; options?: unknown[]; description?: string };

export type IndexItem = {
  id: string;
  type: ResourceType;
  title: string;
  summary: string;
  tags: string[];
  version: string;
  url: string;
  preview?: { video?: string; poster?: string };
  related?: string[];
};

export type Resource = IndexItem & {
  license: string;
  export?: string;
  signature?: string;
  params?: Param[];
  install: { kind: "code" | "shader-set" | "tokens" | "scene"; entry?: Record<string, unknown> };
  files: { path: string; content?: string; url?: string }[];
  requires?: { engine?: string; items?: string[]; fonts?: string[] };
  usage: string;
  notes?: string[];
};

const PUBLIC = path.join(process.cwd(), "public");

export const TYPES: { type: ResourceType; title: string; short: string; blurb: string }[] = [
  { type: "component", title: "Component transitions", short: "Components", blurb: "A card, a button or a panel changes state inside a page that stays still." },
  { type: "transition", title: "Transitions", short: "Transitions", blurb: "From one frame to the next." },
  { type: "text", title: "Text effects", short: "Text", blurb: "How words arrive." },
  { type: "camera", title: "Camera and energy", short: "Camera", blurb: "Shakes, punches, orbits and strokes that draw themselves." },
  { type: "background", title: "Backgrounds", short: "Backgrounds", blurb: "Paper shaders, tuned and ready to recolor." },
  { type: "palette", title: "Palettes", short: "Palettes", blurb: "Color roles for a brand, contrast-checked." },
  { type: "font-pair", title: "Font pairs", short: "Fonts", blurb: "Free type pairings with a scale for video." },
  { type: "recipe", title: "Recipes", short: "Recipes", blurb: "Whole video structures that combine the rest." },
];

export function getIndex(): { site: string; count: number; items: IndexItem[] } {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC, "registry.json"), "utf8"));
}

export function getResource(id: string): Resource | null {
  const f = path.join(PUBLIC, "r", `${id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}

/** A preview file exists once `pamo registry previews` has rendered it. */
export function hasPreview(p?: string): boolean {
  return !!p && fs.existsSync(path.join(PUBLIC, p));
}

export const typeTitle = (t: ResourceType) => TYPES.find((x) => x.type === t)?.title ?? t;
