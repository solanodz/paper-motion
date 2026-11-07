---
name: brand-sheet
description: Build the brand sheet, one animated web page with the whole brand (wordmark, identity, palette, type, motion, sound, shader set), plus PNG and PDF exports, from the brand folder. Use when the user wants to see, share or export their brand at a glance, asks for brand guidelines or an identity page, or has just finished their visual system.
---

# Brand sheet

Put the whole brand on **one page** that plays live: the wordmark over a field built from the brand's ramp, who the brand is, how it looks, how it moves, how it sounds, and its shader set running. The page reads the brand folder, so it is re-run, never rewritten, whenever the brand changes.

`pm` is the paper-motion engine CLI: `npx @paper-motion/engine` (inside the paper-motion repo itself: `node packages/engine/bin/pm.mjs`), run from the user's project root.

## 1 · Check the brand folder

Read `brand/`. The sheet needs `tokens.json` (from `visual-system`); everything else fills its section when present and is left out when not:

| Section | Reads |
|---|---|
| Cover | `tokens.json` (wordmark files, ramp), `IDENTITY.md` (In one line, Keywords) |
| Identity | `IDENTITY.md` (Offer, Audience, Personality, Voice, Not, References) |
| Visual system | `tokens.json`, `VISUAL.md` (Rules) |
| Motion | `MOTION.md`, `motion.json` (text behavior, move clips) |
| Sound | `SOUND.md`, `sound/sounds.json` (playable samples) |
| Shader set | `shader-set/set.json` (`[{ id, video }]`, videos relative to `shader-set/`) |

No `tokens.json` yet: offer `visual-system` first. Tell the user which sections will be empty and which skill fills each (`motion-style`, `sound-kit`, `shader-set`).

## 2 · Build and export

```
pm sheet            # first run copies the template to brand/sheet/index.html, then exports
```

It writes `brand/sheet/sheet.png` (full page) and `brand/sheet/sheet.pdf` (one long page). `pm sheet --serve` serves it live with reload, for the user to open in a browser and for you to iterate on.

Look at `sheet.png` yourself, section by section, against the brand:
- every face is the brand's, no fallback; every text legible;
- the cover reads as this brand (the field calm, the wordmark clear);
- nothing empty, broken or overflowing; samples use the brand's real words and Facts only.

## 3 · Make it this brand's page

`brand/sheet/index.html` is the user's copy. Adjust it when the brand asks for it: section order, copy, a sample line, a section the template lacks (a product shot, a menu, a logo in use). Keep it reading from the brand folder rather than hard-coding values, so a change in `tokens.json` still flows through. `pm sheet --fresh` replaces it with the template again; say so before using it on an edited copy.

## 4 · Paper copy (optional)

If Paper Desktop is connected and the user wants the sheet on the canvas: create a page named `<brand> · brand sheet` in a new or chosen file and place `sheet.png` on a 1440-wide artboard with `<img src="paper-asset:///<absolute path to sheet.png>">`. That costs about four calls on the free plan; say so first. Never write into the user's existing pages.

## 5 · Close

Done when `sheet.png` and `sheet.pdf` exist, you have checked every section, and the user has seen the sheet (attach the PNG, or give the paths and the `--serve` URL). Re-run `pm sheet` after any later skill changes the brand. Name the next step: `motion-style`, which decides how the brand moves.
