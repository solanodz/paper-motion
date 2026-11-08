---
name: paper-motion
description: "The entry to the paper-motion pack: see where a brand stands and which skill comes next, from brand identity to finished videos. Use when the user mentions paper-motion, asks where to start, what to do next, or wants help with \"my brand and its videos\" without naming a step."
---

# paper-motion

A pack of skills that takes someone from "I have a brand" to a brand sheet and creative-directed videos, and lets designers who already decided their brand skip to the parts they need. This skill routes; it holds no state of its own. The state is the brand folder (`brand/`).

Before stating what a skill does or advising to skip one, read that skill's `SKILL.md`: the lines here orient, they don't replace it.

## 1 · See where the brand stands

Run `pamo status` from the project root (`pamo` is shorthand: type it as `npx paper-motion`, the engine's npm package, since the bare npm name `pamo` belongs to an unrelated package; inside the paper-motion repo itself, `node packages/engine/bin/pamo.mjs`). It lists what `brand/` already has and the next step on the main flow. Read the files it marks as done before recommending anything; a file can exist and still have open items under `## Open`.

Tell the user in two or three lines what their brand already has, then propose the next step with one sentence on why.

## 2 · The main flow

| Step | Skill | Settles | Writes |
|---|---|---|---|
| 1 | `identity` | who the brand is: offer, audience, personality, voice, facts, references | `IDENTITY.md` |
| 2 | `visual-system` | typefaces, palette, shape, wordmark | `VISUAL.md`, `tokens.json`, wordmark files |
| 3 | `brand-sheet` | the whole brand on one live page | `sheet/` (page, PNG, PDF) |
| 4 | `motion-style` | pace, camera, text behavior, transitions, color, endings | `MOTION.md`, `motion.json`, move clips |
| 5 | `sound-kit` | sound palette, typing, music, loudness | `SOUND.md`, `sound.json`, samples |
| 6 | `shader-set` | the brand's moving material | `shader-set/` |
| 7 | `make-video` | one piece, from brief to render | `brand/pieces/<name>/` |

Every step runs an interview (`interview`) with options the user sees or hears, and logs each decision in `brand/decisions/`. Re-run `brand-sheet` after any step changes the brand.

## 3 · Other ways in

- **"Just make a video."** Go to `make-video`. It reads whatever the brand folder has and settles the rest inside the piece's own intake with one question each; offer the missing brand steps once, don't force them.
- **A designer with a brand already defined.** Every brand skill has an import start: fonts, hex codes, a brand manual, a website, a Figma or Paper file. Point them at the step whose decisions they already have, and the skill writes them down and asks only what is missing.
- **"Use paper-motion.app" / resources by name.** The user names backgrounds, effects, palettes, fonts or a recipe from paper-motion.app. Go to `make-video`: it reads `llms.txt`, installs them with `pamo add` and builds the piece around them. With no brand folder yet, a palette and a font pair from the registry (`pamo add sage-night instrument`) are enough to start.
- **Changing one thing.** Go straight to the skill that owns it (a new palette → `visual-system`, slower videos → `motion-style`); it re-runs only that branch.
- **Paper Desktop.** Recommended for hand-tuning shaders (`shader-set`) and for style frames, never required. Mention the free plan's 100 calls a week before a session that uses it.

## 4 · Rules

- One step at a time: finish or park a step before opening the next.
- The brand folder is the source of truth; a skill writes only its own files.
- Facts on screen come only from IDENTITY.md's Facts or the user's words.
- Speak the user's language; the files stay in English.
