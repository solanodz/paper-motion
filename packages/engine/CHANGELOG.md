# Changelog

All notable changes to the `paper-motion` npm package. Dates are release dates on npm.

## Unreleased

- **Chains**: \`pamo chain init <piece>\` installs the blocks of a chosen structure (\`--board <id> --option D\`, or \`--parts id:sec,…\`) as one scene each under \`pieces/<piece>/\` with a \`chain.json\`; \`pamo chain <piece>\` renders them in the brand's look and joins them into one video (\`whip\`, \`cut\`, \`dissolve\`, \`dip\`), keeping each part's sound and setting the loudness once. \`--check\` warns when a part is cut before its land.
- Scenes expose the gestures they cue (\`B.cue\`) as \`window.__pm.marks\`.
- Blocks with a dark panel keep their type light in light brands (`search-type`, `browser-frame`, `terminal-run`, `light-sweep`); `drag-drop`'s cards follow the brand's mode.

## 0.2.7 · 2026-11-10

- A new resource type, **blocks**: 29 ready-made 4–8 s moments (annotations, interfaces, code, data, type, brand, effects), installed like recipes and customized through their `CONFIG`; each recomposes for 16:9, 9:16 and 1:1.
- `pamo registry previews` renders blocks; `pamo add --set` writes their values into `CONFIG`.

## 0.2.6 · 2026-11-10

- `camera()` in `paper-motion/kit`: a 3D world for a piece (`place`, `at`, `travel` with keyframes, `focus` with depth of field and gradual exits). Every recipe is rebuilt on it: a corridor the camera travels (launch, manifesto), a column it descends (three-things), a line it dollies along with a pull-back recap (explainer), a window it tilts into and punches (product-demo), a slab it swings around (before-after), a sleeve it orbits (release).
- A new resource type, **shots**: 3–6 s camera gestures (`focus-pull`, `pass-over`, `cursor-guide`, `push-in`, `turn-in`), installed like recipes, chained before one or used alone.
- `scramble` measures letters by layout width, so it works inside a 3D world.

## 0.2.5 · unreleased

- Recipes declare `beats` (the structure as a timeline); boards draw them, and a recipe board may hold a structure of the agent's own (`--option "@Title | 18 | Hook 0-2 …"`), which `parseReply` returns as `structure`.
- Three recipes: `manifesto` (words only, three statements and a turn), `three-things` (three cards, three mechanics) and `before-after` (two states, one wipe).
- Font pairs keep their own stylesheet when the family is unchanged, so self-hosted faces work: the new `geist-serif` pair (Geist Serif headlines served by paper-motion.app, Geist text, Geist Mono labels) is the site's own look.

## 0.2.4 · 2026-11-09

- `pamo board --url` waits for the user's choice by default (`--no-wait`, `--wait <minutes>`); `--choose 3` or `--choose 1-3` lets them pick several options, and the reply line lists them (`A+C · type-on · scramble`). `parseReply` returns `picks`.
- llms.txt: read the installed skill at once, the decisions that always go through a board, every chosen move appears in the piece.

## 0.2.3 · 2026-11-09

- Boards get short links and a return channel: `pamo board --url` stores the board on the site (`/b/<id>`, 90 days) and falls back to the long link; `--wait [minutes]` prints the reply line when the user chooses in the browser; `--long`, `--forget <id>`. `lib/live-board.js` gains `shortenBoard`, `awaitChoice`, `forgetBoard`; the search filters move to `lib/find.mjs` (shared with the site's MCP at `/mcp`).

## 0.2.2 · 2026-11-09

- Every background is a color family: `recolor(item, palette)` in `lib/customize.mjs`, `pamo add <background> --palette <id|brand>`, boards with a `--look` show backgrounds recolored and their reply lines carry the values. A background's CSS `background` is a param; `B.shader` paints it.
- Two recipes: `product-demo` and `release`.
- Six halftone backgrounds filter `material-b.jpg`, rendered by the engine, instead of an image hosted by Paper.

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
