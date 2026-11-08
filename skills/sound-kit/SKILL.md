---
name: sound-kit
description: "Decide how a brand sounds (sound palette, typing, music stance, loudness) from options the user hears, and write brand/SOUND.md, brand/sound.json and playable samples. Use when the user wants to choose sounds, sound effects, typing sounds or music for their videos, or has a motion style and no sound kit yet."
---

# Sound kit

Settle **how the brand sounds**: the family of cues its gestures make, how its typing sounds, whether music plays, and how loud pieces are. The user chooses by ear, from clips that play one after another. This skill owns sound craft: read [references/sound-craft.md](references/sound-craft.md) before building any option.

`pamo` is shorthand for the paper-motion engine CLI: type it as `npx paper-motion` (the npm package `paper-motion`; the bare npm name `pamo` belongs to an unrelated package), or `node packages/engine/bin/pamo.mjs` inside the paper-motion repo itself, run from the user's project root.

## 1 · Read what exists

Read `brand/`. IDENTITY.md's personality and where people meet it, and `motion.json` (pace, text behavior, moves) steer every recommendation; the demos use the brand's look and motion. No `motion.json` yet: offer `motion-style` first, because sound follows gestures.

If `SOUND.md` exists, ask what should change and re-run only those branches.

## 2 · Pick the start

- **Import start** when the user brings sounds: a typing recording, sound effects they own, a music track, a sonic guide. Typing recordings are split with `pamo keys <file> --out brand/sound/keys`; music goes to `brand/assets/music/`. Write what is stated (`By: source`), and ask only for what is missing.
- **Guided start** otherwise.

## 3 · Interview

Call `interview` with this question bank, the file `brand/SOUND.md`, and a depth of one round (two if typing needs a recording). Sound options are heard, so boards play in sequence:

```
pamo new <letter> --dir brand/.interview/sound --move <brand's move> --pace <brand's pace> --text <brand's text> --camera <brand's camera> --sound <soft|crisp|airy|ambient|none>
pamo board brand/.interview/sound/a/scene.html … --clip 7 --sequence --labels "A · …|B · …" --out brand/.interview/sound.mp4
```

The demo carries the brand's motion, so only the sound changes; the board levels each option's loudness so the comparison is fair. Ask the user to listen with headphones or speakers.

- **Palette** (sequence board): soft, crisp, airy (subtle swells); add ambient (airy over a low bed) only for brands that want constant atmosphere, and "none" when the identity leans silent.
- **Typing** (only when `motion.json`'s text is typing, or pieces will show a terminal or chat): the source of keystrokes. A recording the user makes or owns (best: 20–30 s of their own keyboard, split with `pamo keys`), the engine's bundled bank of real keys (`"bank": "default"`: a CC0 pack, the default when the user has no recording), or synthesized keys. Published work needs a source the user can vouch for.
- **Music** (a question of fact): their own track, or sound design only.
- **Loudness** (a question): −14 LUFS for social feeds, −16 for web and presentations; recommend from where people meet the brand.

## 4 · Write

When the user confirms the interview's summary:

1. **`brand/sound.json`**, for scenes and the sheet:

```json
{
  "palette": "soft",
  "lowpass": 1800,
  "cues": {
    "transition": { "type": "whoosh", "dur": 0.9, "from": 220, "to": 700, "peak": 0.6, "gain": 0.2, "body": 0.4 },
    "land": { "type": "thud", "freq": 55, "gain": 0.22, "decay": 0.45 },
    "text": { "type": "paper", "dur": 0.5, "gain": 0.035 },
    "bed": null
  },
  "keys": { "bank": "brand/sound/keys", "style": null, "gain": 0.16 },
  "music": null,
  "loudness": -16
}
```

   The cue values are the chosen palette's (they are in the demo scene's `PAL`); adjust them only from what the user said. `keys.bank` is `"default"` for the bundled CC0 keys, a folder for the user's own bank, or `null` when typing is synthesized (then `style` is `creamy`, `thock` or `clack`).
2. **Samples for the sheet:** `pamo sound-samples` renders each cue and a typing line to `brand/sound/*.wav` and `sounds.json`.
3. **`brand/SOUND.md`**, the same in words:

```md
# <Brand> · sound kit

## Palette
<the family and why it fits; what each gesture sounds like>
## Typing
<the source of keystrokes and its license, the level>
## Music
## Loudness
## Rules
<the few that keep it consistent: nothing above the master low-pass, repeats always varied, ...>
## Open
```

Rules are yours to derive: show them in the closing summary and log them with `By: agent`. Every decision has its entry in `brand/decisions/`. Then re-run `pamo sheet` if `brand/sheet/` exists, so the sheet plays the samples.

## 5 · Close

Done when palette, typing (if it applies), music and loudness are settled (or parked), `sound.json` and `SOUND.md` agree, and the samples play. Name the next step: `shader-set`, the brand's moving material.
