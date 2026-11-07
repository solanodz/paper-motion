# paper-motion v1 · spec

Collapsed from the grilling session of 2026-11-07. Terms are defined in [GLOSSARY.md](../GLOSSARY.md); the two
hard-to-reverse decisions are in [docs/adr](./adr/).

## Destination

v1 is done when someone with no motion experience goes from "I have a brand" to "I have my brand sheet and my
first piece", and a designer who already knows their brand can bring what they have and skip to the parts they need.
Web app and MCP server are out of scope for v1.

## Who it is for

- **Primary:** founders, developers and small studios who use a coding agent and don't know After Effects. No jargon,
  visual options, the agent proposes instead of expecting the user to know.
- **Also:** designers. Every skill has an import start, so they never answer questions they have already settled.

## Principles

1. **Small skills that compose.** One skill per decision the user makes and file it produces. Skills call each other;
   they never copy each other's text. Each knowledge area has one owner skill.
2. **The brand folder is the state** ([ADR 0001](./adr/0001-brand-folder-is-the-source-of-truth.md)). Every skill reads
   `brand/` before acting and writes back only its own files. Any skill can be entered first.
3. **Two starts in every skill.** Guided start runs an interview; import start takes what the user brings and asks
   only for what is missing.
4. **Interview, not forms.** Rounds of numbered questions with a recommended answer each, worded so "yes" accepts it.
   Facts are the agent's job; decisions are the user's. Visual choices are shown as option boards (stills for form,
   4–6 s clips for motion), answered with a letter. Deep by default; "decide for me" applies the recommendations and
   logs them in `brand/decisions/` for later review. Credit: Matt Pocock's `grilling`.
5. **Paper is recommended, never required.** Every skill works with the engine alone. When Paper Desktop is connected,
   skills use it to show and hand-tune (especially the shader set and the brand sheet copy), and they tell the user the
   rough call cost on the free plan (100 calls a week).
6. **No pictorial logos.** The pack builds a wordmark from the chosen typeface or uses the user's logo.
7. **No copyrighted music.** Sound effects are synthesized; music is the user's own file or none.
8. **Free fonts by default.** The agent proposes only openly licensed fonts (Google Fonts, Fontsource, Geist...).
   Licensed fonts come in as files under `brand/assets/fonts/`.
9. **Skills in English, conversation in the user's language.**
10. **One piece at a time.** The user picks the format of each piece (16:9, 9:16 or 1:1); another format is another
    piece, made on its own.
11. **Every skill fires on its own.** All skills are model-invoked: they trigger from what the user says ("help me define my brand") as well as by name (`/identity`), because the primary user doesn't know the skill names. `/paper-motion` stays the guided entry. Descriptions carry distinct triggers so two skills never claim the same request.

## Repo layout

```
paper-motion/
├── skills/
│   ├── paper-motion/      router
│   ├── interview/
│   ├── identity/
│   ├── visual-system/
│   ├── brand-sheet/
│   ├── motion-style/
│   ├── sound-kit/
│   ├── shader-set/
│   └── make-video/        today's skills/paper-motion, renamed
├── packages/engine/       @paper-motion/engine, the `pm` CLI (ADR 0002)
├── examples/paper-motion-brand/   our own brand folder: example and test fixture
├── docs/                  spec, ADRs, per-skill docs pages
├── GLOSSARY.md
└── README.md              install, flow, credit to Matt Pocock
```

`works/` stays out of the repo (`.gitignore`): it holds a copyrighted instrumental.

Distribution: `npx skills add solanodz/paper-motion` (any agent), a Claude Code plugin manifest, and the engine on npm.

## The brand folder

Lives at `brand/` in the user's project.

| File | Written by | Holds |
|---|---|---|
| `IDENTITY.md` | identity | purpose, audience, personality, voice, references, anti-references |
| `VISUAL.md` | visual-system | typefaces, palette, shapes, wordmark rules, in plain language |
| `tokens.json` | visual-system | the same as data: font files and families, colors with roles, type scale, spacing |
| `MOTION.md` | motion-style | pace, camera, chosen moves, terminal/typing rules, do and don't |
| `SOUND.md` | sound-kit | sound palette, music stance, loudness target |
| `shader-set/` | shader-set | `set.json` (entries in one format) and the rendered loops |
| `decisions/` | every skill | one short note per decision: what, why, and whether the agent decided it |
| `assets/` | import starts, visual-system | wordmark, logo, fonts, music, reference images |
| `pieces/<name>/` | make-video | each piece's brief, scene and renders |
| `.interview/` | interview | option boards shown during interviews (throwaway) |

A skill only writes its own rows. `decisions/` is shared and append-only.

## Skills

Every skill reads `brand/` first, offers the two starts, and ends by updating its files, logging decisions, and naming
the next skill (the router's logic, inlined).

### `paper-motion` (router)
Reads which brand files exist, tells the user where they are ("identity and visual system done"), and proposes the next
step on the main flow: identity → visual-system → brand-sheet → motion-style → sound-kit → shader-set → make-video.
Lets the user enter anywhere. Holds no state of its own.

### `interview` (model-invoked, called by the others) · built
The mechanics only: design tree, frontier, rounds, recommended answers, "decide for me", and option boards (`pm board`
renders 2–6 options as one lettered still or clip). Each calling skill brings its own question bank and depth.

### `identity` · built
- **Guided:** 3–4 rounds. Purpose, audience, what it is and isn't, personality (pairs like calm/loud, warm/cold),
  voice samples, references and anti-references (links to work they admire and why).
- **Import:** a website URL, a brand manual (PDF), an existing deck or doc.
- **Writes:** `IDENTITY.md`.

### `visual-system`
- **Guided:** 1–2 rounds. Option boards of type pairings set in the brand's own words, palettes shown on those
  pairings, shape language; then the wordmark from the chosen typeface (with chrome / flat variants as later options).
- **Import:** font names or files, hex codes, `tokens.json` from Figma or Paper, a site to sample.
- **Writes:** `VISUAL.md`, `tokens.json`, `assets/wordmark.*`.
- **Owns:** typography and color craft.

### `brand-sheet`
- Builds the brand sheet as an **animated** web page rendered by the engine: wordmark with its treatment, palette,
  type specimens, live terminal/typing demo, motion and sound principles, the shader set playing.
- Exports PNG and PDF. If Paper is connected, also writes a static copy to a new Paper page.
- Re-runnable whenever the brand changes. Reads everything, writes only `brand/sheet/`.

### `motion-style`
- **Guided:** 1–2 rounds of option clips: pace (calm/fast), camera (still / continuous travel / cuts), moves from the
  engine's library, text behavior (typing, reveals), how color enters.
- **Import:** reference videos with what the user likes in each, an existing motion guide.
- **Writes:** `MOTION.md`. **Owns:** motion craft (today's `aesthetics.md` motion sections move here).

### `sound-kit`
- **Guided:** 1 round of short audio options: sound family (keys, clicks, thuds, whooshes, textures), brightness,
  music stance (bring your own / none).
- **Writes:** `SOUND.md`; any music lands in `assets/`. **Owns:** sound design and loudness.

### `shader-set`
- Three sources, any mix: the user's own loops and images; agent-made from the visual system; hand-tuned in Paper
  (recommended, read back with `get_jsx`).
- One shared format per brand (size, duration, base color), like `works/shader-set` (29 loops, 1920×1080, 6 s).
- **Writes:** `shader-set/`.

### `make-video`
- Today's skill, renamed: brief → style frames → test shot → full piece → final render, with the piece intake.
- New: starts from a **recipe** (launch, explainer 30–45 s, social loop, end card, README loop), asks the **format**
  (16:9, 9:16, 1:1) and makes that one piece. The look, moves, sound and material come from `brand/`.
- **Owns:** scene building and rendering. **Writes:** `pieces/<name>/`.

## Engine additions

- **Moves library:** named, reusable moves with demo clips (wipe, push, masked reveal, dive into a frame, terminal
  typing, cut on the beat, …), callable from scenes.
- **Option boards** · built: `pm board a.html b.html … [--t s | --clip s] --labels "A · x,B · y"` composes 2–6
  options into one lettered still (.png) or clip (.mp4), for `interview`.
- **Brand sheet page:** a page template that reads `brand/` and plays live.
- Already in place: scenes as pure functions of time, Paper shaders, synthesized SFX, motion blur, loudness pass.

## Validation

Before release, run the whole flow on three invented brands that differ a lot (a café, a developer tool, a musician).
Each must end with its brand sheet and first piece with no manual fixes from us. If the three come out looking alike,
the skills are imposing a style instead of finding one.

## Build order

1. Restructure the repo; move the engine to `packages/engine`.
2. `interview`
3. `identity`
4. `visual-system`
5. `brand-sheet`
6. `motion-style` + the moves library
7. `sound-kit`
8. `shader-set`
9. Today's skill → `make-video` + recipes
10. Router `paper-motion`
11. `examples/paper-motion-brand/`
12. Validation with three invented brands

Steps that don't share files can run in parallel sessions once 1–2 are done.

## Not yet specified

- Each skill's full question bank (written while building it).
- The exact list of v1 moves and v1 recipes.
- How import start reads a PDF manual or a website (tools available per agent).
- The brand sheet's section layout beyond the Paper version we built.
- npm: the `@paper-motion` scope needs an npm organization created first (the name is free today, as is the unscoped
  `paper-motion`); the GitHub repo `solanodz/paper-motion` does not exist yet.
