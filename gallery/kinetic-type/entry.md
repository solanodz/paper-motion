---
title: Kinetic type
summary: Words snap into justified blocks of mixed sizes while the camera dives through one word into the next block.
format: "16:9"
duration: 12
techniques: [kinetic type, justified blocks, camera dive, springs, motion blur]
bring:
  - Nothing. Optional - a voice-over or a track to time the words to.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: script
    label: The text, block by block
    default: "every word | has a weight | some whisper | others SHOUT | and the camera | follows the loudest"
  - key: closing
    label: The closing line
    default: Type, in motion.
  - key: accent
    label: Accent colour
    default: "mint #4BE38C"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 25
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; push-ins on the holds, a harder landing for SHOUT, a bigger close. The typeface and background changed mid-run (a rounded sans on a grid became this condensed grotesk on a plain gradient).'
credits: []
---

## Prompt

```text
Make a 12 s video, 1920×1080, 60 fps, rendered from code (an HTML/canvas
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg).

THE LOOK (check these numbers on your stills)
- Background: a plain deep green-black radial gradient (#0B1F17 in the
  centre to #020403 at the corners) with a little film grain. No grid.
- Type: one tall condensed grotesk at its heaviest weight (Helvetica Neue
  Condensed Black, or Avenir Next Condensed Heavy), lowercase, tight
  letter-spacing (-1%). Words are white; one or two per block are in
  {{accent}}.
- Each block is JUSTIFIED: every line of the block is exactly the same
  width, about 62% of the frame. Short words get huge to fill a line
  (cap height up to 28% of the frame); small connecting words ("is",
  "the", "and") are set tiny and stacked two-high beside a big word, like
  a type poster. Line gaps are ~3% of the block width.

THE TEXT
{{script}}
Split on "|": each part is one block. Then the closing line
"{{closing}}".

TIMING (exact)
- 0.0–9.6 s: six blocks, 1.6 s each. Inside a block, words arrive one at a
  time, 0.12–0.2 s apart, then the block holds ~0.4 s.
- 9.6–12.0 s: the close. The last block shrinks and slides up out of
  frame while "{{closing}}" builds in the centre, medium size, tracking
  opening from -2% to +4%; it holds to the end.

HOW WORDS MOVE (lively: nothing linear, everything overlaps)
- A big word enters scaling from 70% with a spring (damping ~12, one
  visible overshoot), rising 30 px; small words slide in from the side of
  the big word they pair with, 2 frames later.
- When a word lands, the words already in the block nudge (2–4 px) as if
  they made room: secondary motion.
- Between blocks the camera moves, alternating two ways:
  a) the dive: the camera zooms into the accent word of the block until
     its counter (the hole of an "o" or "e") fills the frame and the next
     block is waiting inside it;
  b) the push: the finished block shrinks to ~40% and slides up to the top
     edge while the next block builds below it, so the old block is still
     visible for a moment above the new one.
- Real motion blur on every camera move: average 8 sub-frames.

CHECKS (required)
- A contact sheet: the middle and the end of every block, every camera
  move at its midpoint, and 10.5 s and 11.8 s. Look at it.
- Is every block justified to the same width, with huge and tiny words
  mixed? Do the dives read as flying through a letter? Is there a clear
  ending held on the closing line?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Centred lines, not blocks.** Each line is a different width. Ask for every line of a block justified to the same width by scaling each word.
- **Words fade in.** Ask for the spring scale and the side slides, with the other words nudging.
- **Hard cuts between blocks.** Ask for the dive through the accent word's counter and the push-up, alternating.

## Notes

What the agent had to decide for itself:
- With a condensed face, the 28% cap height and the 62% width can't both hold for a short word alone, so some blocks are one slim line and "others" and "SHOUT" got a little extra tracking.
- It kept "SHOUT" in capitals, as written.
- The dives fly through the counters of the "o" of "word" and "some" and the "e" of "camera"; small counters need very deep zooms (70–85×), where the motion-blur steps can show.

Inspired by a common After Effects exercise, stacked kinetic typography with camera moves.
