---
title: Event poster
summary: A square typographic poster for an event that builds itself on a visible grid, with the date, place and speakers sliding into place, and holds as a finished poster.
format: "1:1"
duration: 15
techniques: [kinetic type, grid systems, typographic poster, masks, springs, end card]
bring:
  - Nothing.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: event
    label: The event's name
    default: Form & Function
  - key: edition
    label: Edition or year
    default: "2027"
  - key: date
    label: The date
    default: 12–13 March
  - key: place
    label: The place
    default: Lisbon · The Old Tram Depot
  - key: speakers
    label: Four speakers (split by |)
    default: "Nadia Oduya | Tom Brekke | Lucía Ferrán | Kenji Mori"
  - key: colours
    label: Paper, ink and one accent
    default: "warm paper #EFECE4, ink #121212, electric violet #5B3DF5"
  - key: site
    label: Web address
    default: formfunction.events
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 19
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; the second line of the name lands whole, a heavier month beside the date, all small type on one baseline rule, a smooth roll for the rearrangement, the speakers re-stacked inside the accent bar.'
credits: []
---

## Prompt

```text
Make a 15 s square event announcement, 1080×1080, 60 fps, rendered from
code (an HTML canvas or DOM page where every frame is a pure function of
time, captured with headless Chrome and encoded with ffmpeg).

THE CONTENT
"{{event}}" {{edition}}. {{date}}. {{place}}. Speakers: {{speakers}}
(split on "|"). {{site}}. Colours: {{colours}}.

THE LOOK (check on your stills)
- A typographic poster on a 6-column grid with a 48 px margin: hairline
  ink rules mark the columns and rows. Only type, rules and one accent
  bar; no pictures, gradients, circles or discs.
- One heavy grotesk in two weights (heavy for the name and the date,
  regular for the rest). The event's name is set huge (each word as wide
  as the grid allows, cropped by the frame edge if needed); the date
  numbers are the second-largest thing; the place, speakers and site are
  small (2.4% of the frame height).
- One accent: a solid bar of the accent colour spanning a set of columns,
  with type cut out of it or sitting on it.

THE MOTION (the point of this video)
- The grid draws first: rules extend from the edges with a stagger.
- Every element arrives along the grid: words slide in inside masks that
  run along their column or row (type rising out of a rule, a line
  of text wiping in behind a moving bar), landing with a fast ease-out
  and a small overshoot. Elements snap to the grid; nothing floats.
- The camera holds still; the poster moves within itself. Overlap
  everything: the next element starts before the previous one lands.
- Once assembled, the poster rearranges once on the beat (the name
  shifts columns, the accent bar jumps to another row, the speakers
  re-stack), then settles into its final layout.

TIMING (exact)
1. 0.0–1.5 s: the grid draws in on the paper.
2. 1.5–5.0 s: the event name and the edition arrive, word by word.
3. 5.0–8.0 s: the date and the place; the accent bar slides into its row.
4. 8.0–11.0 s: the four speakers tick in one by one down a column.
5. 11.0–12.5 s: the rearrangement.
6. 12.5–15.0 s, the close: the final poster, with {{site}} at the bottom;
   the rules fade to 40%. Hold to the end. The final frame should work
   as a printed poster.
- Motion blur on the slides (average 6 sub-frames).

CHECKS (required)
- A contact sheet: 1, 3, 6, 9.5, 11.8, 14.5. Look at it.
- Does every element sit on the grid? Is the name huge and the small type
  truly small? Does the final frame read as a finished poster? Is the
  ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Everything mid-size.** Without a huge name and truly small details there's no hierarchy. Ask for the name cropped by the frame and details at 2.4%.
- **Floating type.** Elements that fade in at random positions ignore the grid. Ask for masks that run along the grid lines and a snap into place.
- **No final poster.** If the last frame doesn't work as a still, the piece has no ending. Ask for a held final layout that could be printed.

## Notes

What the run built, which is what to copy: one canvas page with a 6 × 6 grid of 164 px modules inside the margin; every word rises out of or drops from a rule inside a mask; 6 sub-frames of motion blur over a 180° shutter, so small type doesn't ghost.

What the agent had to decide for itself:
- "Each word as wide as the grid allows" met the "&": "FORM" fills the width alone and "& FUNCTION" fills it as one line.
- "The name shifts columns" became a roll along its row that lands flush, so the name isn't cropped for most of the film.
- The month and the edition sit on a second tier, between the date and the small type.
- Helvetica Neue Bold and Regular from the system fonts stand in for the heavy grotesk.

Made for conferences, talks, launches and shows. The event, the venue and the speakers are invented.
