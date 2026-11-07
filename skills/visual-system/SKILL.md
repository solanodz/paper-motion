---
name: visual-system
description: Decide how a brand looks (typefaces, palette, shape language, wordmark) with option boards, and write brand/VISUAL.md, brand/tokens.json and the wordmark files. Use when the user wants to choose fonts, colors or a look for their brand, needs a wordmark, or has an identity and no visual system yet.
---

# Visual system

Turn the brand's character into **typefaces, a palette, a shape language and a wordmark**, chosen by the user from option boards. This skill owns type and color craft: read [references/type-and-color.md](references/type-and-color.md) before building any option.

`pamo` is the paper-motion engine CLI: `npx @paper-motion/engine` (inside the paper-motion repo itself: `node packages/engine/bin/pamo.mjs`), run from the user's project root.

## 1 · Read what exists

Read `brand/`. `IDENTITY.md` is the brief: its personality, keywords, voice (casing), facts and anti-references steer every option; use whichever of those sections the file has. If it is missing, offer to run `identity` first; if the user would rather go straight on, ask in round 1 for three words that describe the brand and what it must never look like.

If `VISUAL.md` exists, ask what should change and re-run only those branches.

## 2 · Pick the start

- **Import start** when the user brings decisions: font names or files, hex codes, a brand manual, a Figma or Paper file (with Paper connected, `get_tokens` and `get_computed_styles`), or a site to sample (read its CSS: `font-family`, colors in use). Fonts the user licensed go to `brand/assets/fonts/`. Write what is stated (`By: source`), show it back as one board so they see their own system, and ask only for what is missing.
- **Guided start** otherwise.

## 3 · Interview

Call `interview` with this question bank, the file `brand/VISUAL.md`, and a depth of up to three short rounds. Every visual question is an option board built from the brand's real name and words (IDENTITY.md's Facts, Voice, Offer), started from `pamo new <x> --dir brand/.interview/<topic> --still`.

- **Logo** (a question of fact): does the brand already have one? If yes, it goes to `brand/assets/` and leads; the wordmark supports it. Ask for any other material that helps in the same question.
- **Type pairing** (board, three options, `--cols 1`): display + text face in one layout with the brand's name as a title, its line as a subtitle and a short paragraph, at the sizes of the type scale. The options span the space the identity allows, never three cousins. Labels name both families.
- **Shape language** (board): soft, hard, organic. Same layout and words in each; open dimensions in neutral stand-ins.
- **Palette** (board, three options, after type): each palette shown on the chosen pairing in the same layout, every color in its role and in proportion: ground most, figure, accent once. Labels carry the core hex codes; the question lists them all. Include a light and a dark ground among the options unless the identity settles it.
- **Wordmark** (board, after palette, `--cols 1`): the name, cased as the voice says, in the display face, in three tunings of weight and tracking, each on the chosen palette's ground and on its reverse. Render each with `pamo wordmark` and place the PNGs in the option scenes.

The usual shape: logo, type and shape; then palette; then wordmark.

## 4 · Show the whole system, then confirm

Before the closing summary, derive what the rounds imply and log each item with `By: agent`: the type scale, radius and stroke, the ramp for gradients and shaders, the wordmark's clear space, and the few rules that keep the system consistent. Then build the **system board**, one still that shows all of it: the wordmark, the pairing at its real sizes, every palette color and every ramp tone in role, a shape in the chosen language.

```
pamo new system --dir brand/.interview --still     # then lay out the system
pamo still brand/.interview/system/scene.html --t 1 --out brand/visual-board.png
```

Show the board with interview's closing summary. A change reopens that branch; confirmation releases step 5.

## 5 · Write

1. **Wordmark files**, cropped to the ink: `pamo wordmark "<name>" --family <family> --css <url> --weight <w> --tracking <t> --color <dark ink> --out brand/assets/wordmark-on-light.png`, and again with the light ink to `wordmark-on-dark.png`. Look at both on their grounds.
2. **`brand/tokens.json`** in the shape of [references/tokens.md](references/tokens.md).
3. **`brand/VISUAL.md`**, the same system in words, with the reasons:

```md
# <Brand> · visual system

## Typefaces
<display and text faces, what each is for, weights in use, why they fit this brand>
## Palette
<each color: hex, role, where it appears; contrast of every text color on the ground>
## Ramp
<the tones gradients and shaders build from>
## Type scale
<display, title, body, caption, for a 1080 short side>
## Shape
<language, radius, stroke>
## Wordmark
<how it is set, the files, clear space, smallest size; the logo if there is one>
## Rules
<the few do's and don'ts that keep it consistent>
## Open
```

Every decision also has its entry in `brand/decisions/`, as `interview` describes. `brand/visual-board.png` stays: it is the system at a glance.

## 6 · Close

Done when type, palette, shape and wordmark are settled (or parked), the user confirmed the system board, `tokens.json` matches the reference shape, and both wordmark files exist in the intended face. Name the next step: `brand-sheet`, which puts the whole brand on one page.
