---
title: Mask text
summary: Giant words become windows onto moving photos, revealed by a slash that sweeps across, ending on a clean lockup.
format: "16:9"
duration: 10
techniques: [text masks, wipe reveals, Ken Burns, kinetic type]
bring:
  - Three photos of your own in a photos/ folder (landscape, at least 1920 px wide).
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: words
    label: Three words, one per photo (split by |)
    default: "COAST | DUNES | STONE"
  - key: closing
    label: Closing line
    default: Go see it.
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 11
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; reframed photos, the slash riding the colour change, no dead beat before the close. Both critics wanted a bigger end card, which this prompt keeps small on purpose.'
credits:
  - asset: Coast photo
    by: Dietmar Rabich, Wikimedia Commons
    license: CC BY-SA 4.0
  - asset: Desert photo
    by: Giles Laurent, Wikimedia Commons
    license: CC BY-SA 4.0
  - asset: Rocks photo
    by: Wikimedia Commons
    license: CC BY-SA 4.0
---

## Prompt

```text
Make a 10 s title sequence, 1920×1080, 60 fps, rendered from code (a
canvas page where every frame is a pure function of time, captured with
headless Chrome and encoded with ffmpeg). Use the three photos in
./photos, in alphabetical order.

THE LOOK (check these numbers on your stills)
- One word per photo: {{words}} (split on "|"). Each word is set in a
  heavy, wide sans (Helvetica Neue Black or Arial Black), uppercase,
  tracking +2%, and so big it spans ~86% of the frame width.
- The letters are WINDOWS: inside them you see the photo, slowly moving
  (a Ken Burns push of 6% plus a slight pan over the word's life);
  outside them is a flat background. Words 1 and 3 sit on warm off-white
  (#F2F0EB), word 2 on near-black (#0C0C0D).
- A thin slash (4 px, tilted 20°, black on light, white on dark) does the
  reveals, with a soft shadow under the letters.

TIMING (exact)
- Each word has 2.6 s: 0.5 s reveal, 1.7 s hold, 0.4 s exit.
- Reveal: the slash sweeps from left to right; the word appears behind it
  as it passes (a hard mask edge that follows the slash), the letters
  rising 12 px into place.
- Hold: the photo keeps moving inside the letters; the letters breathe
  (+1.5% scale over the hold).
- Exit: the background floods in from the slash's edge, closing the
  letters; the next word's background colour takes over.
- 7.8–10 s, the close: the slash draws once more and leaves behind
  "{{closing}}" set small and clean (4% of the frame height, centred),
  with a thin rule under it; hold to the end.

CHECKS (required)
- A contact sheet: the middle of each reveal, each hold and each exit,
  then 8.5 and 9.8. Look at it.
- Is each word ~86% of the width, the photo clearly moving inside the
  letters, the slash and the mask edge in sync? Is there a clear ending?
- Deliver the mp4 and the contact sheet, and a CREDITS.txt for the photos.
```

## Failure modes

- **Words too small to see the photo.** Ask for ~86% of the frame width and a heavy, wide face.
- **A still photo inside the letters.** Ask for the Ken Burns push and pan over each word's life.
- **The mask edge doesn't follow the slash.** Ask for the reveal to be driven by the slash's position.

## Notes

What the agent had to decide for itself:
- The exit sweeps right to left, like a wiper, with the next background flooding in behind the slash.
- The letters rise one by one as the slash passes them, rather than the whole word at once.
- Each word pans a different way inside its letters (60–110 px), so the holds don't feel the same.

Inspired by a common After Effects exercise, masked text reveals with a wipe line. The demo uses three photos from Wikimedia Commons, credited above; bring your own.
