---
name: shader-set
description: Build a brand's shader set, its bank of moving material (fields, patterns, logo effects, image filters) in one shared format, from the user's own loops and images, shaders made by the agent from the visual system, or shaders tuned by hand in Paper. Use when the user wants backgrounds, textures, loops or "material" for their videos, wants to bring their own footage or shaders, or has a visual system and no shader set yet.
---

# Shader set

Give the brand its own **moving material**: a bank of loops in one format that every piece draws from, so videos look like the brand even before type appears. Entries are data (a Paper shader and its props, or a file), so pieces re-render them natively at any size; the rendered loops are previews and footage.

`pm` is the paper-motion engine CLI: `npx @paper-motion/engine` (inside the paper-motion repo itself: `node packages/engine/bin/pm.mjs`), run from the user's project root. `pm shaders` lists every Paper shader with its props and presets; `pm shaders <Name>` shows one.

## 1 · Read what exists

Read `brand/`: `tokens.json` (palette, ramp, mode, wordmark files), IDENTITY.md (personality, anti-references), `motion.json` (pace: calm brands want slow fields, fast ones more graphic material). No `tokens.json` yet: offer `visual-system` first.

If `brand/shader-set/set.json` exists, ask what to add, replace or drop, and work only on that.

## 2 · Interview

Call `interview` with this question bank, the file `brand/shader-set/SET.md`, and a depth of two rounds.

**Round 1**
- **Sources** (several allowed):
  - **Paper** (recommended): the user tunes each shader by hand on the canvas and you read the values back. Follow [references/paper-library.md](references/paper-library.md); say the call cost on the free plan first.
  - **Agent**: you write entries from the visual system (step 3).
  - **Their own**: loops (mp4/mov) or images they bring. Loops go to `brand/assets/loops/` and play covering the frame; images go to `brand/assets/materials/` and feed image filters (Water, FlutedGlass, HalftoneDots, ImageDithering, LensDistortion).
- **Format** (a question): size and loop length shared by every entry; recommend 1920×1080 and 6 s unless the brand lives in vertical feeds (1080×1920).
- **Families** (a question, several allowed): fields (gradients, noise, grain), graphic (dithering, dots, waves, spirals), logo (LiquidMetal, Heatmap, GemSmoke on the wordmark), image filters (on the brand's material). Recommend from the identity; respect the anti-references.

**Round 2**
- **Keep or drop** (numbered boards): build the candidates (step 3), show the boards, and let the user keep entries by number ("keep 1, 4, 7–9") or ask for changes on any ("5 but slower").

## 3 · Write the entries

`brand/shader-set/set.json`:

```json
{
  "format": { "width": 1920, "height": 1080, "duration": 6, "fps": 30 },
  "entries": [
    { "id": "mesh-ground", "source": "agent", "shader": "MeshGradient", "props": { "colors": ["#050505", "#3a3a3a", "#cfcfcf", "#121212"], "distortion": 0.85, "swirl": 0.35, "speed": 0.45 }, "loop": 1.5 },
    { "id": "logo-metal", "source": "agent", "shader": "LiquidMetal", "image": "wordmark", "props": { "fit": "contain", "scale": 0.8, "shape": "none", "colorBack": "#000000", "colorTint": "#ffffff", "repetition": 5, "distortion": 0.14, "contour": 0.6, "speed": 1 } },
    { "id": "glass-material", "source": "agent", "shader": "FlutedGlass", "image": "assets/materials/poster.png", "props": { "fit": "cover", "size": 0.45, "distortion": 0.5 }, "motion": { "param": "shift", "from": -0.15, "to": 0.15 } },
    { "id": "studio-loop", "source": "user", "file": "assets/loops/studio.mp4" }
  ]
}
```

- **props** are the shader's React props exactly (`pm shaders <Name>`), colors from the palette and ramp only.
- **image**: `wordmark` (light ink, for LiquidMetal and GemSmoke), `wordmark-dark` (dark ink: Heatmap reads dark shapes on white), or a path in `brand/`.
- **loop** (seconds) crossfades the end into the start; only for diffuse fields, never crisp shapes.
- **motion** animates one prop back and forth over the loop: what keeps static shaders (image filters, Waves, DotGrid) alive.
- **Agent entries**: aim for 12–20 candidates across the chosen families. Each shader at default `speed` is usually too fast for calm brands (0.2–0.5 is typical). Set every color from `tokens.json`; never a hue the palette lacks.

## 4 · Build, look, render

```
pm shader-set build      # one scene per entry (shots/) and numbered boards (boards/)
pm shader-set boards     # boards/board-<k>.png, 12 per board
pm shader-set render     # renders/<nn>-<id>.mp4 for every entry (or --only 3,7), recorded in set.json
```

Look at every board yourself before showing it, and rebuild entries that fail: nothing empty or sparse at the board's
moment, every color from the palette, logo entries legible, image filters actually biting into the material. Show
the boards for round 2; render only the entries the user keeps, and drop the rest from `set.json`.

## 5 · Write and close

Write `brand/shader-set/SET.md`: the format, the families and what each entry is for (atmosphere, transitions, end
cards, behind type), and the sources with their licenses for user material. Log the decisions in `brand/decisions/`.
Re-run `pm sheet` if `brand/sheet/` exists.

Done when every kept entry has its loop in `renders/`, `set.json` lists only kept entries, and the user has seen
them. Name the next step: `make-video`, the first piece.
