---
title: Words that move
summary: Each word does what it says - zoom, break, stretch, melt - over its own black-and-white shader, in a brutalist vertical launch.
format: "9:16"
duration: 15
techniques: [kinetic type, GLSL shaders, glitch, displacement, brutalist layout]
bring:
  - Nothing.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: opening
    label: The opening line
    default: This video wasn't edited by a human.
  - key: verbs
    label: Four verbs, each will do what it says (split by |)
    default: "ZOOM | BREAK | STRETCH | MELT"
  - key: closing
    label: Closing line
    default: All from words.
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 26
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; verbs that act more literally on their letters, and the shaders turned into a 1-bit dither so the piece is strictly black and white.'
credits: []
---

## Prompt

```text
Make a 15 s vertical launch video, 1080×1920, 60 fps, rendered from code
(a WebGL page where every frame is a pure function of time, captured with
headless Chrome and encoded with ffmpeg). Black and white only.

THE LOOK (brutalist; check on your stills)
- Two typefaces: a classic serif (New York or Times) for the calm lines,
  set large (11% of the frame height), and a monospace rendered on a
  coarse pixel grid for the verbs (draw it into a low-resolution canvas
  and scale it up with nearest-neighbour, so it looks like a pixel font),
  set huge (verbs span ~85% of the width).
- Under each scene, a tiny mono caption (1.4% of the height, grey) that
  reads like the line of code that made it, e.g. swirl({ twist: 0.35 →
  0.85 }).
- Hard cuts between scenes, on the beat. Backgrounds alternate black and
  white.

TIMING (exact)
1. 0.0–3.0 s: "{{opening}}" builds word by word in the serif, white on
   black, over a slow black-and-white caustic shader (water light).
2. 3.0–4.2 s: "No" in the serif, then a timeline ruler that shatters into
   pixels.
3. 4.2–13.0 s: "Say" in the serif at the top, and one verb at a time
   (2.2 s each), {{verbs}} (split on "|"), each doing exactly what it says
   to its own letters and to a full-frame black-and-white shader made for
   it:
   - ZOOM: a swirl the camera dives into, the word scaling through;
   - BREAK: the word splits into shards and pixel glitch, over a dark
     liquid-metal blob;
   - STRETCH: the letters stretch like taffy under a water ripple;
   - MELT: the letters drip and sag over a slow flowing marble.
   For other verbs, invent the matching effect the same way.
4. 13.0–15.0 s, the close: a hard cut to white; "{{closing}}" in the
   serif, black, centred; hold.

CHECKS (required)
- A contact sheet: 1.5, 3.6, the middle of each verb, 14.5. Look at it.
- Does each verb visibly do what it says, to its own letters? Is it
  strictly black and white? Are the cuts hard and on the beat? Is the
  closing line held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Every verb gets the same fade.** Ask for each verb's effect to act on its own letters (dive, shards, taffy, drips).
- **Colour creeping in.** Ask for strictly black and white, shaders included.
- **A smooth crossfade edit.** Ask for hard cuts on the beat between scenes.

## Notes

What the agent had to decide for itself:
- Black and white can't strictly alternate across seven scenes that start black and end white, so the "No" beat flips from white to black mid-scene.
- There is no soundtrack, so the given times are the beat.
- To stay strictly black and white, the backgrounds became a 1-bit dither on a 4 px grid; only the type's edges and the captions are grey.

Based on one of our own earlier pieces, paper-motion's own launch video.
