# Sound effects

Scenes can declare synthesized sound effects. They are generated from code
(no samples), seeded, and mixed into the render automatically — the same scene
always produces the same audio, frame-aligned with the picture.

```js
s.sound({ lowpass: 1800 });                 // master: cap brightness (Hz), optional gain
s.sfx(0, 'drone', { dur: s.duration, freq: 49, gain: 0.04 });
s.sfx(2.1, 'pen', { dur: 0.6, gain: 0.15, pan: -0.2 });
s.sfx(3.0, 'thud', { freq: 58, gain: 0.45 });
```

Declare cues at setup time, computed from the same timing values the visuals
use (never inside `s.update`). Cues are absolute scene times in seconds.

## Voices

| type | sounds like | options (defaults) |
|---|---|---|
| `drone` | low bed, slowly breathing | `dur`, `freq` 55, `gain` 0.05, `attack` 3, `release` 4 |
| `swell` | soft chord pad (root, fifth, octave) | `dur` 4, `freq` 73.4, `gain` 0.1 |
| `pen` | pen/pencil writing on paper | `dur` 1, `gain` 0.12, `rate` 7 (strokes/s), `tone` 520 Hz |
| `paper` | paper movement, whoosh | `dur` 0.8, `gain` 0.14 |
| `thud` | soft low stamp / body hit | `freq` 62, `gain` 0.5, `decay` 0.45 |
| `knock` | low wooden knock | `freq` 140, `gain` 0.3, `decay` 0.16 |
| `tick` | small dull tick | `freq` 200, `gain` 0.1, `decay` 0.05 |
| `sweep` | pitch glide | `dur` 0.6, `from` 160, `to` 80, `gain` 0.08 |
| `key` | a keystroke (press, upstroke) | `gain` 0.3, `kind` letter/space/enter, `style` creamy/thock/clack, `bank` (folder of real keystrokes) |
| `whoosh` | air moving past (camera moves) | `dur` 0.7, `gain` 0.2, `from` 320, `to` 1200, `peak` 0.6, `body` 0 |
| `flick` | something light landing | `gain` 0.12 |

All voices take `pan` (-1..1) and `seed`. Keys skip the master low-pass (see Typing). The master chain low-passes at
`lowpass` (default 2000 Hz, 24 dB/oct), high-passes rumble at 30 Hz,
normalizes peaks to -2 dBFS and soft-clips.

## Typing

Typing should sound like a person on a real keyboard:

1. **Real keystrokes.** Split a recording of real typing into single hits once:
   `pm keys <recording> --out brand/sound/keys` (any audio or video file; it finds each hit and marks the heaviest
   as space/enter). Use only recordings the user made or that carry a clear license (CC0) when the result will be
   published. Without a bank, `key` synthesizes a keystroke (`style` creamy, thock or clack) as a fallback.
2. **Human rhythm, shared with the picture.** `typingTimes(text, { start, cps, seed })` from `paper-motion/moves`
   gives each character's time (bursts inside words, a beat between them, more after punctuation). Feed the same
   times to `typeOn(el, text, t, { times, cursor })` and `keySounds(s, text, times, { bank, enter })`, so every letter
   lands on its keystroke.
3. **Soft and open.** `keySounds` defaults to a quiet level (0.16). Keys run on their own bus, outside the master
   low-pass, with a little less box (~450 Hz) and a gentle presence lift, so they stay crisp without getting loud.

## Craft

Sound craft (palettes, balance, typing sources, loudness) belongs to the `sound-kit` skill. When the brand has
`brand/sound.json`, use its cues for each gesture, its `keys` for typing, its `lowpass` in `s.sound()`, and render
with `--loudness <its loudness>`.

## CLI

```
render <scene> [--no-sfx] [--loudness -16]   # sfx mixed by default (and with --audio); one loudness pass
sfx <scene> [--out file.wav]       # export only the effects
```
