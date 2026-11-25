---
title: Year in review
summary: A vertical recap of your year in five big numbers. Each gets its own colour card, counts up on the beat and hands off to the next through a shape.
format: "9:16"
duration: 18
techniques: [kinetic type, counters, shape transitions, beat timing, flat colour, end card]
bring:
  - Your five numbers.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: name
    label: Who it's for
    default: Bramble Coffee
  - key: year
    label: The year
    default: "2026"
  - key: stats
    label: "Five stats as label: value, the last can be words (split by |)"
    default: "cups poured: 182,400 | new regulars: 3,120 | origins roasted: 14 | hours open: 4,380 | most-ordered: the flat white"
  - key: colours
    label: Four colours
    default: "tomato #E5483A, butter #F3D36B, deep ink #1D1B2E, mint #9ED8C3"
  - key: closing
    label: The closing line
    default: See you next year.
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 24
  note: 'Two directors passes with fresh blind critics, both "needs rework"; the shapes kick on every beat during the holds, bigger labels, each value at its own height, the close carrying its words in on the bands, a tighter shutter so the blur doesnt ghost.'
credits: []
---

## Prompt

```text
Make an 18 s vertical year-in-review, 1080×1920, 60 fps, rendered from code
(an HTML canvas or DOM page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg). Silent, but cut to
an imagined 120 bpm: every change lands on a beat (0.5 s grid).

THE CONTENT
"{{name}}", {{year}}. Five stats: {{stats}} (split on "|", each
"label: value"). Colours: {{colours}}.

THE LOOK (check on your stills)
- Each stat is a full-screen card of one flat colour from the palette,
  type in another palette colour with strong contrast. No gradients, no
  photos, no drop shadows: flat colour, big type, a few shapes.
- The value is the hero: a heavy grotesk (or a heavy condensed), set as
  large as it fits, at least 80% of the frame width, tight tracking. The
  label sits small above it (3% of the frame height), in lowercase.
- A few graphic shapes per card (a circle, a star, a squiggle, a pill),
  flat in the palette, entering with springs and drifting slowly; they
  never cover the value.

THE MOTION (the point of this video)
- Numbers count up from zero with a strong ease-out, each digit rolling
  like an odometer (digits slide vertically, the right-hand digits
  fastest), landing exactly on the beat with a 4% overshoot and settle.
  Separators (commas) stay put. A value in words builds letter by letter
  with springs instead.
- Every hand-off is a different shape transition born from the outgoing
  card: a shape on card A grows until it fills the frame and becomes
  card B's colour; or the value's own digits zoom through the camera;
  or the card splits into stripes that slide away; or a circle iris.
  No crossfades, no plain slides.
- Overlap: the next card's label is already arriving while the
  transition finishes; nothing waits for the previous move to end.

TIMING (exact)
1. 0.0–2.0 s: "{{year}}" huge, then "{{name}}" small under it.
2. 2.0–15.0 s: the five stats, 2.6 s each, the count landing by the
   second beat of each card and holding.
3. 15.0–18.0 s, the close: the four colours stack as horizontal bands
   that slide in on the beat; "{{closing}}" and "{{name}}" set on them.
   Hold to the end.
- Motion blur on the fast moves (average 6 sub-frames).

CHECKS (required)
- A contact sheet: 1, the middle and the end of each stat card, and 17.
  Look at it.
- Does every count land on a beat, with the digits rolling, not
  flickering? Is each transition different and born from the previous
  card? Is the value the biggest thing on every card? Is the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Flickering numbers.** Swapping the whole number each frame looks like a glitch. Ask for digits that roll like an odometer and land with an overshoot.
- **Slides and crossfades.** The same transition five times reads as a slideshow. Ask for a different shape hand-off each time, born from the outgoing card.
- **Small numbers.** If the value isn't the biggest thing on the card, nothing lands. Ask for at least 80% of the frame width.

## Notes

What the run built, which is what to copy: one canvas page with each digit in its own rolling column (the right-hand ones travel furthest) and the comma fixed; every count lands on its beat with a damped bounce and a 4% scale overshoot; six hand-offs, each from a shape on the outgoing card (the "0" of the year zooming through, a star that spins to fill the frame, stripes, an iris, dots that swell and merge, a pill that becomes the first band of the close).

What the agent had to decide for itself:
- 2.6 s cards don't fit a 0.5 s grid, so each hand-off is one beat long, spanning the boundary.
- A 4% overshoot on the count itself would show wrong digits, so the overshoot is on the value's scale.
- "See you next year." is split across three bands, with the name on the fourth.

Made for businesses, creators and teams: swap the five numbers and the palette. The coffee shop and its numbers are invented.
