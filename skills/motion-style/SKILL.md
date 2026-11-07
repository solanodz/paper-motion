---
name: motion-style
description: Decide how a brand moves (pace, camera, text behavior, a repertoire of transitions, how color enters, endings) from short option clips, and write brand/MOTION.md, brand/motion.json and the brand's move clips. Use when the user wants to define how their videos should move, choose transitions or effects, or has a visual system and no motion style yet.
---

# Motion style

Settle **how the brand moves** before any piece exists, so every video moves the same way: its pace, its camera, how its text appears, the one to three transitions it keeps, how color enters, and how pieces end. The user chooses from short clips set in the brand's own look. This skill owns motion craft: read [references/motion-craft.md](references/motion-craft.md) before building any option.

`pamo` is the paper-motion engine CLI: `npx @paper-motion/engine` (inside the paper-motion repo itself: `node packages/engine/bin/pamo.mjs`), run from the user's project root. The engine's moves live in `paper-motion/moves` (`MOVES` lists them all; `PACE` holds the timing per pace).

## 1 · Read what exists

Read `brand/`. IDENTITY.md's personality (calm ↔ loud, intimate ↔ grand), keywords, where people meet it and what its videos are for steer every recommendation; `tokens.json` gives the look the clips are set in. No `tokens.json` yet: offer `visual-system` first, because clips in neutral greys hide half the decision.

If `MOTION.md` exists, ask what should change and re-run only those branches.

## 2 · Pick the start

- **Import start** when the user brings reference videos (links or files) with what they like in each, or an existing motion guide. Write what is stated (`By: source`), name what you see in the references in this skill's terms (pace, camera, text, transitions), and confirm those reads in round 1.
- **Guided start** otherwise.

## 3 · Interview

Call `interview` with this question bank, the file `brand/MOTION.md`, and a depth of two rounds. Every visual question is a clip board: build each option with

```
pamo new <letter> --dir brand/.interview/<topic> --move <move> --pace <calm|medium|fast> --text <typing|rise|blur|track|plain> --camera <still|drift|travel>
pamo board brand/.interview/<topic>/a/scene.html … --clip 7 --labels "A · …|B · …" --out brand/.interview/<topic>.mp4
```

The demo (7 s) alternates the brand's name and its own line at the chosen pace, in its colors and type, read from `brand/` (run `pamo` from the project root). Each option changes only the dimension asked. Dimensions already settled use the settled choice; open ones use neutral stand-ins (medium pace, still camera, crossfade, plain text), never your recommendation, so one board never pre-sells another. Option scenes are sketches: edit them freely, and keep those edits in the brand's clips later.

**Round 1**
- **Pace** (clip board): the same move and text at calm, medium and fast.
- **Camera** (clip board): still, drift, travel. Travel pans one continuous world from frame to frame and replaces the transition.
- **Text behavior** (clip board, three or four): typing, rise, blur, track. Offer typing only when the identity is a terminal, a chat or a process.

**Round 2**
- **Transitions** (clip board, three or four moves at the chosen pace and camera): the user keeps one to three as the brand's repertoire; say where each would be used (between sections, into a detail, the ending).
- **How color enters** (a question): constant, per section, or only through shaders as an event. Recommend from VISUAL.md's rules.
- **Endings** (a question): resolve on the wordmark, on a line, or cut to the ground; say which repertoire move leads into it.

## 4 · Write

When the user confirms the interview's summary:

1. **Move clips.** For each move in the repertoire, keep its option scene (`pamo new … --move <move>` with the chosen pace, text and camera) as `brand/motion/<move>/scene.html` and render it from the project root: `pamo render brand/motion/<move>/scene.html --out brand/motion/<move>.mp4 --motion-blur 8 --no-sfx`. Check each against the motion craft's "Checking a clip".
2. **`brand/motion.json`**, for scenes and the brand sheet:

```json
{
  "pace": "fast",
  "camera": "travel",
  "text": "typing",
  "color": "event",
  "ending": "wordmark",
  "timing": null,
  "moves": [{ "name": "wipe", "use": "between sections", "video": "motion/wipe.mp4" }]
}
```

3. **`brand/MOTION.md`**, the same in words, with the reasons:

```md
# <Brand> · motion style

## Pace
<the pace, its timing (moves, holds, stagger), why it fits>
## Camera
## Text
<the behavior and its numbers: characters a second, stagger, cursor>
## Transitions
<each move in the repertoire and where it is used>
## Color
## Endings
## Rules
<the few that keep it consistent: one type animation at a time, motion blur on finals, ...>
## Open
```

Rules are yours to derive from the decisions (one type animation at a time, motion blur on finals, ...): show them in the closing summary and log them with `By: agent`. Every decision has its entry in `brand/decisions/`, as `interview` describes. Then re-run `pamo sheet` if `brand/sheet/` exists, so the sheet shows the new motion.

## 5 · Close

Done when pace, camera, text, transitions, color and endings are settled (or parked), each repertoire move has its clip in `brand/motion/`, and `motion.json` and `MOTION.md` agree. Name the next step: `sound-kit`, which decides how the brand sounds.
