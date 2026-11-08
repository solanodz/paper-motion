# Motion craft

What makes motion read as directed (After Effects) and not as generated. Use it to build option clips, write
recommendations, set `MOTION.md`'s rules, and check every clip.

## Pace

- **Pace is the first decision**, and one pace holds a piece. Calm: gestures of 1 s and more, holds of 2–3 s.
  Medium: 0.4–0.6 s moves, 1.5 s holds. Fast: 0.2–0.3 s moves, under 1 s holds, on the beat.
- Read it from IDENTITY.md: calm ↔ loud and intimate ↔ grand set the pace far more than the category does.
- **Fast still reads.** Every line holds long enough to be read once; speed comes from cutting the waits, never the
  reading time.

## Curves

- Pick one or two curves and reuse them: `ease.outExpo` / `outQuart` for arrivals that settle, `inOutCubic` for
  moves between states, `inCubic` for exits, `linear` only for constant drift. `spring()` for things that land.
- Stagger groups by 50–120 ms (the pace sets it). Big moves get a beat of anticipation.

## Camera

- **still**: the frame holds; type and shapes move. Editorial, calm.
- **drift**: a slow constant push-in (3–6 % over the shot). A dead-still frame of a render looks generated; drift
  keeps it alive.
- **travel**: one continuous world the camera moves through; places are areas of one desk and nothing cuts to black.
  The strongest choice for showing a process.
- Never more than one camera idea in a shot.

## Transitions

- A brand keeps a **repertoire** of one to three transitions (from the moves library) and uses them consistently;
  variety comes from content, not from new transitions every cut.
- Match the transition to the pace: `cut` and `maskReveal` for fast, `wipe` and `push` for medium, `crossfade` and
  `zoomThrough` for calm. `zoomThrough` (diving into a frame) is the move for "and now, inside"; over detailed content
  (UI, small type) render it with less motion blur (`--motion-blur 4`) or a shorter move, or it smears.
- The louder transitions carry a character, so pick them on purpose: `whip` and `flash` for energetic brands, `cells` and
  `slices` for graphic, grid-minded ones, `glitch` only for a digital or raw identity, `flip3D` and `iris` sparingly.
- `shake`, `punch` and `rgbSplit` are hits: put them on the beat (or a sound cue), never on every beat.
- When a component changes state (a card, a button, a panel), reach for the component transitions: `magicMove` when
  A and B share parts, `diveIn` to go into a detail, `whipPan` for energy, `flipLift` / `unfold` for a reveal with
  weight. They are built in layers (parts that become each other, springs, a secondary effect); a plain slide or fade
  of a whole card reads as a template. Render them with `--motion-blur 5`.

## Text

- Text is said once, then holds. One type animation at a time.
- **typing** only when the identity is literally a terminal, a chat or a process; otherwise it reads as a cliché.
- **rise** (words from behind a mask line) is the neutral default; **blur** suits calm and atmospheric brands;
  **track** suits luxury and editorial ones.

## Color

- Color is most powerful as an event: a frame that turns, a section that gets its tint, a "less color" beat. Decide
  whether color is constant, enters per section, or arrives only through shaders.

## Finish

- Motion blur on every final (`render --motion-blur 8`): crisp frames of moving things look generated.
- Texture that lives: a little grain over the frame; grounds with depth.
- A long piece is a sequence of ideas: give each beat its own mechanic tied to its meaning, vary scale and density
  between beats, and keep one quiet constant (a frame, a margin, the type) so the variety reads as one piece.

## Checking a clip

- The move reads in one viewing; nothing pops, jumps or flickers.
- Text is legible at every frame it is meant to be read.
- Only the asked dimension differs between options; the brand's real words and look in all.
