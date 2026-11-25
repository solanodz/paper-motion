---
title: Data chart
summary: A minimal glowing line draws itself while the camera rides its head and a counter keeps pace, ending on the result.
format: "16:9"
duration: 10
techniques: [data visualisation, line draw, camera follow, counters, glow]
bring:
  - Your numbers, or keep the example ones.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: title
    label: Chart title
    default: Monthly active users
  - key: data
    label: The values, in order (label value)
    default: "Jan 12, Feb 15, Mar 14, Apr 19, May 23, Jun 21, Jul 28, Aug 34, Sep 31, Oct 39, Nov 46, Dec 58"
  - key: unit
    label: Unit after the number
    default: k
  - key: accent
    label: Line colour
    default: "electric cyan #3DE0FF"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 18
  note: 'Two director''s passes with fresh blind critics, both "needs rework" (faster opening, a beat on the peak, bigger result). The run first used a busier look (grid, panel, dots); the look was made minimal afterwards and re-rendered from the same page.'
credits: []
---

## Prompt

```text
Make a 10 s chart animation, 1920×1080, 60 fps, rendered from code (an
HTML/canvas page where every frame is a pure function of time, captured
with headless Chrome and encoded with ffmpeg).

THE LOOK (minimal; check these numbers on your stills)
- A plain near-black background (#08090B) with only a soft vignette. No
  grid, no panel frame, no boxes: just the line, one thin baseline and a
  few labels, with a lot of empty space.
- The title "{{title}}" in a monospace, small (2.4% of the frame height),
  white at 60%, top left.
- The chart fills ~80% of the width and ~55% of the height. Only the first
  and last month under the baseline and the top value at the left, in grey
  mono. The line: a 3 px core in {{accent}} with a subtle 10 px glow of the
  same colour and a faint gradient fill under it. No dots on the line.
- A big counter (mono, white, 8% of the frame height) shows the current
  value with "{{unit}}".

THE DATA
{{data}}
Scale the y axis from 0 to a round number just above the maximum.

TIMING (exact)
1. 0.0–0.9 s: the baseline draws in from the left, the labels and the
   title type in.
2. 0.9–6.2 s: the line draws left to right, easing in and out. The camera
   rides the head of the line: zoomed in to ~1.6×, it keeps the head a
   little right of centre and follows it smoothly (no jitter), so you feel
   the climb. The counter counts along with the line's current value. At
   the biggest dip after a peak, a small callout pops beside it with the
   month and the value.
3. 6.2–7.4 s: the camera pulls back to show the whole chart, on a smooth
   ease. The head of the line pulses twice with a soft ring.
4. 7.4–10.0 s: the close. The counter settles on the last value and a chip
   beside it shows the growth from first to last value as a percentage
   ("+383%"), in {{accent}}. A one-line takeaway under the chart types in.
   Everything holds to the end.

CHECKS (required)
- A contact sheet: 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 6.8, 7.4, 8.5,
  9.8. Look at it.
- Is it minimal (no grid, no frame, no dots)? Is the line glowing, the
  camera following its head smoothly, the counter matching the line? Is the percentage right? Is there a clear
  ending held on the result?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A static chart that just wipes in.** Ask for the camera riding the line's head at ~1.6× and pulling back at the end.
- **The counter doesn't match the line.** Ask it to read the value from the same curve that draws the line.
- **Busy chart.** Grid, frames and dots everywhere. Ask for the minimal version: line, baseline, a few labels.
- **Flat line.** Ask for the glow (core plus blur) and the gradient fill.

## Notes

What the agent had to decide for itself:
- The counter and the title stay fixed on screen while the camera zooms, or the zoom would push them out.
- Near the start the head can't sit right of centre without showing empty space, so the camera eases into following it.
- It wrote the takeaway line itself, true for the data: "Every dip recovered within a month. December: all-time high."

Inspired by a common After Effects exercise, data-driven line graphs in a news style. The numbers are made up.
