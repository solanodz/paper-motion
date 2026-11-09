# Changelog

All notable changes to the `paper-motion` npm package. Dates are release dates on npm.

## 0.2.1 · 2026-11-08

Fixes found by making paper-motion's own launch video as a fresh user.

- The CLI's default site is `https://paper-motion.vercel.app` until the `paper-motion.app` domain is connected, so `search`, `add` and `board --url` work without `PAPER_MOTION_SITE`.
- `pamo add` scaffolds what a recipe reads but boards never settle: `brand/motion.json` (pace) and `brand/sound.json` (cues) with defaults when missing, and the brand's name through `--brand "Name"`. Without a name it says so instead of rendering "brand".
- `llms.txt` step 4 says that `add` never overwrites a value already in the project and that re-choosing needs `--force`.
- Recipes dim the background layer behind type (`CONFIG.backgroundOpacity`, with a vignette on launch, explainer and end-card) and size card bodies and the action line for phones.
- Registry items can set `preview.at`, the poster time in seconds; the five recipes use it so their posters land on a readable frame. `registry build` keeps non-string preview fields when it drops missing files.

## 0.2.0 · 2026-11-08

paper-motion.app: a registry of named resources and the commands that use it.

- `pamo registry build` publishes `registry.json`, `r/<id>.json`, `llms.txt` and `llms-full.txt` from `registry/`; `pamo registry previews` renders a clip and a poster per move and recipe, and `build` publishes only previews that exist.
- `pamo add <id…>` installs resources as code the user owns: moves into `moves/`, backgrounds into `brand/shader-set/set.json`, palettes and font pairs into `brand/tokens.json`, recipes into `pieces/<id>/`. `--set key=value` writes the user's values through the same generator the site uses (`lib/customize.mjs`); `paper-motion.json` records what was installed. `pamo list` and `pamo search` read the index; `search` filters by the choosing metadata (when, mood, energy, role, colors, motion…) and `--near` ranks by color fit.
- `pamo board --url` builds and validates live board links (`/b#payload`, deflate + base64url, nothing reaches a server): 2–4 labelled options the user compares in their own look, tunes and chooses; the reply is one line the agent parses with `lib/live-board.js`. `lib/board.mjs` remains the rendered board.
- `paper-motion/moves` grows from 12 to 38: transitions (whip, cells, slices, iris, glitch, flip3D, flash), text (scramble, popIn, flipIn, roll, odometer, barReveal), camera and energy (shake, punch, orbit, rgbSplit, drawOn) and component transitions (magicMove, whipPan, diveIn, flipLift, squashDrop, snapScroll, unfold, tileSwirl). Each move is its own file under `runtime/moves/`; shared helpers are `paper-motion/kit`; one whip blur filter per stage.
- `pamo new --move` accepts any transition in the library; `pamo board --motion-blur n` renders option boards with real motion blur.
- `PAPER_MOTION_SITE` overrides the site URL everywhere the engine writes links. OG images are rendered by the engine.
- Examples: the Halo explainer and the Orbit keynote. Sound effects keep their gains next to a voice.
- The engine ships no audio. A user's own recording (`pamo keys`) gives real keystrokes; without one they are synthesized.

## 0.1.0 · 2026-11-08

First public release of the engine as the unscoped npm package `paper-motion` (previously `@paper-motion/engine`, private).

- `pamo` CLI: `setup`, `doctor`, `new`, `still`, `render` (mp4, prores, gif, webm; `--motion-blur`, `--dpr`, `--loudness`, `--audio`), `preview`, `board`, `shaders`, `examples`, `status`, `keys`, `shader-set`.
- Runtime: scenes as pure functions of time, Paper Shaders by name with their React props, seamless shader loops, `paper-motion/brand` (`loadBrand`, `B.shader`, `B.style`, `B.cue`, `B.sound`), `paper-motion/moves` (12 moves), synthesized sound effects mixed into renders.
- Dependencies are found wherever npm puts them, so an install does not re-install them inside the package. Four bundled examples: breath, signal, install-loop, chrome-endcard.
