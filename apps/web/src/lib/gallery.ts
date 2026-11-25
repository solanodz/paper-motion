import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

/** The gallery lives at the repo root: one folder per entry, each with entry.md and its media. */
export const GALLERY_DIR = path.join(process.cwd(), "..", "..", "gallery");

const Variable = z.object({ key: z.string().regex(/^[a-z][a-z0-9_]*$/), label: z.string(), default: z.string() });

const Front = z.object({
  title: z.string(),
  summary: z.string(),
  format: z.enum(["16:9", "9:16", "1:1"]),
  duration: z.number().positive(),
  draft: z.boolean().default(false),
  techniques: z.array(z.string()).min(1),
  bring: z.array(z.string()).default([]),
  variables: z.array(Variable).default([]),
  runs: z.object({
    tried: z.number().int().min(0),
    passed: z.number().int().min(0),
    model: z.string(),
    agent: z.string(),
    date: z.string(),
    minutes: z.number().optional(),
    note: z.string().optional(),
  }),
  credits: z.array(z.object({ asset: z.string(), by: z.string(), license: z.string() })).default([]),
  /** the same prompt run cold again with other values: media in also-<name>.mp4 / .jpg */
  also: z
    .array(z.object({ name: z.string().regex(/^[a-z0-9-]+$/), title: z.string(), note: z.string().optional(), values: z.record(z.string(), z.string()) }))
    .default([]),
});

export type Variable = z.infer<typeof Variable>;

export type Entry = z.infer<typeof Front> & {
  slug: string;
  /** the prompt as written, with {{key}} slots */
  prompt: string;
  failures: { title: string; body: string }[];
  notes: string;
  media: { video?: string; poster?: string; contact?: string };
  /** the `also` runs, with their media resolved */
  alsoMade: { name: string; title: string; note?: string; values: Record<string, string>; video?: string; poster?: string }[];
};

/** The body's "## Heading" sections, by heading. */
function sections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = body.split(/^## +/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    out[part.slice(0, nl).trim().toLowerCase()] = part.slice(nl + 1).trim();
  }
  return out;
}

function readEntry(slug: string): Entry {
  const dir = path.join(GALLERY_DIR, slug);
  const raw = fs.readFileSync(path.join(dir, "entry.md"), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`gallery/${slug}/entry.md: no frontmatter`);
  const front = Front.parse(parse(m[1]));
  const body = sections(m[2]);

  const fence = body.prompt?.match(/```[a-z]*\n([\s\S]*?)\n```/);
  if (!fence) throw new Error(`gallery/${slug}/entry.md: "## Prompt" needs one fenced block`);
  const prompt = fence[1];

  // every {{slot}} in the prompt must be a declared variable, and every variable must be used
  const slots = new Set([...prompt.matchAll(/\{\{([a-z0-9_]+)\}\}/g)].map((x) => x[1]));
  const keys = new Set(front.variables.map((v) => v.key));
  for (const s of slots) if (!keys.has(s)) throw new Error(`gallery/${slug}: {{${s}}} is not a declared variable`);
  for (const k of keys) if (!slots.has(k)) throw new Error(`gallery/${slug}: variable "${k}" is never used in the prompt`);

  const failures = (body["failure modes"] ?? "")
    .split(/\n(?=- )/)
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean)
    .map((line) => {
      const t = line.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
      return t ? { title: t[1].replace(/\.$/, ""), body: t[2] } : { title: line, body: "" };
    });

  for (const a of front.also)
    for (const k of Object.keys(a.values)) if (!keys.has(k)) throw new Error(`gallery/${slug}: also "${a.name}" sets "${k}", which is not a variable`);

  const has = (f: string) => fs.existsSync(path.join(dir, f));
  return {
    ...front,
    slug,
    prompt,
    failures,
    notes: body.notes ?? "",
    media: {
      video: has("video.mp4") ? `/gallery/${slug}/video.mp4` : undefined,
      poster: has("poster.jpg") ? `/gallery/${slug}/poster.jpg` : undefined,
      contact: has("contact.jpg") ? `/gallery/${slug}/contact.jpg` : undefined,
    },
    alsoMade: front.also.map((a) => ({
      ...a,
      video: has(`also-${a.name}.mp4`) ? `/gallery/${slug}/also-${a.name}.mp4` : undefined,
      poster: has(`also-${a.name}.jpg`) ? `/gallery/${slug}/also-${a.name}.jpg` : undefined,
    })),
  };
}

/** Drafts (not yet verified cold) show only in development. */
const showDrafts = process.env.NODE_ENV !== "production" || process.env.PAPER_MOTION_DRAFTS === "1";

export function getEntries(): Entry[] {
  return fs
    .readdirSync(GALLERY_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => readEntry(d.name))
    .filter((e) => showDrafts || !e.draft)
    .sort((a, b) => Number(a.draft) - Number(b.draft) || b.runs.date.localeCompare(a.runs.date) || a.title.localeCompare(b.title));
}

export function getEntry(slug: string): Entry | undefined {
  return getEntries().find((e) => e.slug === slug);
}

/** The director's pass, appended to every prompt that is shown or served. */
export function getDirector(): string {
  return fs.readFileSync(path.join(GALLERY_DIR, "_director.md"), "utf8").trim();
}

/** Fills {{key}} slots; an empty value falls back to the default. */
export function fillPrompt(prompt: string, variables: Variable[], values: Record<string, string> = {}): string {
  const byKey = Object.fromEntries(variables.map((v) => [v.key, v.default]));
  return prompt.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, k: string) => values[k]?.trim() || byKey[k] || "");
}

export function fullPrompt(entry: Entry, director: string, values?: Record<string, string>): string {
  return `${fillPrompt(entry.prompt, entry.variables, values)}\n\n${director}\n`;
}

export function runsLabel(e: Entry): string {
  return e.runs.tried === 0 ? "not yet run cold" : `${e.runs.passed}/${e.runs.tried} cold`;
}
