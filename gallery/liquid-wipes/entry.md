---
title: Liquid wipes
summary: Four flat-colour scenes joined by gooey liquid wipes that splash across the frame, ending on a clean logo scene.
format: "16:9"
duration: 12
techniques: [liquid transitions, metaballs, flat motion graphics, splash droplets]
bring:
  - Nothing.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: words
    label: One word per scene (split by |)
    default: "Bold | Bright | Fluid | Yours"
  - key: palette
    label: Four scene colours
    default: "tomato #FF5A3C, sunflower #FFC93C, teal #1FB5A9, deep violet #3B1E6E"
  - key: brand
    label: Name on the last scene
    default: splash studio
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 21
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; old words pop away instead of mashing into the new ones, the centre burst became a splat with fingers and satellite drops, a darker meniscus behind the liquid''s front.'
credits: []
---

## Prompt

```text
Make a 12 s motion-graphics reel, 1920×1080, 60 fps, rendered from code (a
canvas or WebGL page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg).

THE SCENES
Four flat-colour scenes, one per word: {{words}} (split on "|"), on
{{palette}} in order. Each scene is a small designed motion graphic:
the word huge in a heavy rounded sans (28% of the frame height), white
or near-black for contrast, plus 3–5 simple shapes (circles, rings,
dots, a squiggle, a plus) in the other palette colours that orbit or
bob around it, and the word itself moving (a slight float, a letter that
bounces).

THE LIQUID WIPES (the point of this video)
- Between scenes, the next scene's colour pours in as a liquid: a gooey
  shape built from metaballs (several soft blobs merged by a smooth
  threshold) that sweeps across and fills the frame in ~0.6 s, with a
  wobbling organic edge, smaller droplets flying ahead of it and
  splitting off, and a thin highlight along the edge.
- Each wipe comes from a different direction (from the left, from the
  bottom, as a burst from the centre), and the next scene's content rides
  in inside the liquid, not after it.
- The liquid ends exactly at the frame edges, nothing left over.

TIMING (exact)
- 0.0–2.4 s scene 1; wipe; 3.0–5.4 s scene 2; wipe; 6.0–8.4 s scene 3;
  wipe; 9.0–12.0 s the close: on the last colour, "{{brand}}" set
  medium in the same sans, a small mark beside it made from one of the
  shapes, landing with a little splash of droplets; hold to the end.

CHECKS (required)
- A contact sheet: the middle of each scene, the middle of each wipe, and
  11.8. Look at it.
- Do the wipes read as liquid (merging blobs, a wobbling edge, droplets),
  not as a circle growing? Do they come from different directions? Is
  there a clear ending held on the name?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A circle or a straight wipe.** Ask for merged metaballs with a wobbling edge and droplets flying ahead.
- **Empty scenes.** Ask for each word to come with orbiting shapes and its own small motion.
- **The content appears after the wipe.** Ask for the next scene to ride in inside the liquid.

## Notes

What the run built, which is what to copy: 2D canvas scenes composited by a WebGL metaball pass; the outgoing word is shoved and popped away ahead of the liquid, so two words never mash together; the burst lands as a splat with four fingers racing to the corners and satellite drops merging into it.

What the agent had to decide for itself:
- The fourth word rides in on the last wipe and gives way to the name, so it has under a second on its own.
- "28% of the frame height" was read as cap height (about 420 px type).
- The two directional wipes are tilted (12° and 15°) with a bulge at the front, a little beyond a plain "from the left".

Inspired by a common After Effects exercise, liquid shape transitions between scenes.
