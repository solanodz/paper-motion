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

All voices take `pan` (-1..1) and `seed`. The master chain low-passes at
`lowpass` (default 2000 Hz, 24 dB/oct), high-passes rumble at 30 Hz,
normalizes peaks to -2 dBFS and soft-clips.

## Craft

- Sound follows the picture's hierarchy: one bed (drone), one gesture sound
  per visual gesture (pen while writing, thud on a stamp/highlight, knock when
  a block rises). Silence between gestures matters.
- Keep repetitive cues quiet and vary them (`seed`, `freq`, `pan`).
- "Nothing sharp/high-pitched" → `s.sound({ lowpass: 1500–1800 })`.
- Check balance numerically: `paper-motion sfx scene.html` exports the WAV;
  `ffmpeg -i x.wav -af "highpass=f=2500,astats" -f null -` shows energy above 2.5 kHz.

## CLI

```
render <scene> [--no-sfx]          # sfx mixed by default (and with --audio, if given)
sfx <scene> [--out file.wav]       # export only the effects
```
