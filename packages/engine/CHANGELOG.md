# Changelog

All notable changes to the `paper-motion` npm package. Dates are release dates on npm.

## Unreleased

The studio always says whose turn it is, and never plays a video that is out of date.

- **`piece ask <piece> "question"`**: run before asking the user something in the chat. The studio shows the
  question in a bar across the top with a button back to the agent's app (found from the CLI's own process tree
  on macOS; `--return <url>` or `PAPER_MOTION_RETURN` for an agent in a browser). Cleared by the next `piece
  review` or `piece working`, or `--done`.
- **A turn bar in the studio**, also in the tab's title: your turn (and whether the agent is waiting for it), the
  agent working and for how long, a board waiting, a join in progress, the agent not having read the last
  changes, the studio itself stopped. Commands that wait (`piece review`, `board`) say so while they wait.
- **Stale videos are held.** Each joined render records what it was made from. When the piece changes (a text, a
  length, the order, a join, a scene the agent rewrote), the Assembly or Final video stops, dims and says
  "Updating" with the part being rendered; Approve waits for the new one.
- **The studio joins the draft again by itself** after an edit by hand, with the sound the draft was made with.
  The agent is only called when the join fails. An edit after the final render sends Final back to the agent.
- Fixed: editing a text while in Assembly left the old film in place and told no one; clearing a part's length
  set it to 0.5 s; a part edited by hand in a piece past Parts had to be approved again.

From a test where an agent with no context made a video from `llms.txt` alone:

- `board --url`: option and look values may hold several keys and lists (`graphite:accent=#B8F03C,ramp=["#0A0A0B","#B8F03C"]`, `--look "acid-night:figure=#FFF,muted=#7E8079,geist"`); `--look brand` uses the palette, colors and font pair the project installed.
- `board --await <id> [--wait minutes]` waits (again) for the choice on a board already shared, for shells that cap how long a command runs.
- The studio lists the boards shared while a piece is open, in its Look or Structure stage, with a button to open each and the choice once made (`board --piece <name>` picks the piece when there are several).
- A chosen transition can be the join between two parts of a chain: `"join": "wipe"` (also crossfade, push, zoom-through, iris, slices, flash, scan-reveal, mask-reveal, glitch, cells, flip-3d).
- A tuned palette retunes its ramp (the steps between ground and accent follow the new accent); a background recolored into a palette takes the brand's ground behind everything.
- `chain --check` warns when the total drifts from the brief's length.

From a second test, an agent following the site's "For agents" page alone:

- `piece review` refuses while an earlier stage is not approved, and names the one to review first. It used to mark the earlier stages approved on its own. `--skip` moves on without them, for when the user agreed.
- `chain init --board <link>` looks the board up on the server of the link it is given (a bare id still uses `--site`, or the default site); the error says what to pass.
- After `chain init`, the next steps printed are the real ones in order: review the structure, write the parts, `--check`, `--drafts`, `--draft`, then the full render.
- `chain.json` takes the open piece's title, not the board option's.
- `piece --help`, `chain --help` and `board --help` list every flag of their commands.
- `pamo --version`. Help says `--wait` is in minutes; the docs say `pamo` means `npx paper-motion` and when to review the structure.

## 0.3.0 · 2026-11-11

- **Studio**: `pamo studio` serves a local page where the user follows a piece stage by stage (brief, look, structure, parts, assembly, final), watches each stage's renders, approves or asks for changes, and edits the brief, the words on screen (a part's CONFIG texts, re-rendered on the spot), lengths, joins and order (drag and drop). `pieces/<piece>/piece.json` holds the stages and what the user did; `pamo piece init | review | working | status` is the agent's side (`review` hands a stage over and waits for the decision).
- The studio is the default way to make a piece: `pamo piece init` starts the project's studio in the background (one per project, on the first free port from 4317; `pamo studio --stop` ends it), and the first `pamo piece review` opens it in the user's browser (`--no-open` to skip). `llms.txt` and `make-video` now start every piece there.
- The studio adapts to tablets and phones.
- `pamo chain <piece> --drafts [--only dir]` renders each part alone, quickly, for review; `--draft` joins a quick version.
- **Chains**: `pamo chain init <piece>` installs the blocks of a chosen structure (`--board <id> --option D`, or `--parts id:sec,…`) as one scene each under `pieces/<piece>/` with a `chain.json`; `pamo chain <piece>` renders them in the brand's look and joins them into one video (`whip`, `cut`, `dissolve`, `dip`), keeping each part's sound and setting the loudness once. `--check` warns when a part is cut before its land.
- Boards: a structure beat may name the block or shot that shows it (`[block-id]` in `--option "@Title | 18 | Hook 0-2 [word-swap] …"`, `id` in the payload, checked against the registry); the board plays that clip for the beat.
- Scenes expose the gestures they cue (`B.cue`) as `window.__pm.marks`.
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
