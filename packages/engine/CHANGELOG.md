# Changelog

All notable changes to the `paper-motion` npm package. Dates are release dates on npm.

## 0.4.0 · 2026-11-12

A piece is built from what the user has to show, not from a mood.

**The studio in three steps, and the user edits the video themselves.**

- **What it says** (the brief and the inventory), **Your video** and **Export** replace the seven stages
  (`STAGES` is now brief, inventory, video, final; a piece started before is moved on by itself: look, structure,
  parts and assembly all become video).
- **Make my video** builds the first version from what the user kept, in the studio, with no agent turn.
- **Your video** plays the selected part live (its real scene, with their content, in their brand) and edits it in
  place: Words (sentences, numbers, lists, the picture), Motion (how a sentence arrives, by watching each), Background
  (the brand's, live on hover, or a new one from the library; on one part or every part), Tune (the block's own
  settings and the length). Between parts, the transition, chosen by watching each (or the same everywhere). Parts
  are reordered by dragging, added by intent (say something, show the product, prove it, how it works, end) with
  something kept already in them when they can show it, shown another way (the same words, another block),
  duplicated and removed.
- **Style** changes the whole video's colours (a palette, or each colour), type (a font pair) and pace, in `brand/`.
- **Undo** (and ⌘Z) for every change; **Ask your agent** for what the controls can't do.
- **Export** renders the final from the studio, full quality, and lists the files.
- `lib/edit.mjs`: the edits, readable by any agent too.
- **A project with no look yet gets one before its first video**, named after the piece (`graphite`, `geist-serif`
  and `mesh-graphite`, changed in Style), when the studio builds it or `chain init --plan` fills it. It used to
  render grey on grey and call itself "brand".
- `dither-dissolve` dissolves into the brand's name by default, not "paper-motion"; `focus-pull` shrinks a long
  detail ("12,000") to fit its card instead of cutting it.
- `piece --help` and the steps after `chain init` name the new stages.

- **`inventory <piece> --from <url|file.md|folder|brand>`** gathers the inventory from what the user already has:
  a page (its headline, description, figures and commands, plus screenshots on a desktop and a phone saved to
  `brand/assets/`), a markdown file, a folder of files, or the brand (IDENTITY.md's Facts and its assets). What
  it finds is written as proposals with their source; running it again never proposes twice what is there or
  what the user removed. Figures that count up on load are read once they stop. Only sentences a screen can
  hold and commands that run the product are proposed; `--plain` leaves commands and code out, for a brand whose
  audience does not code.
- **`inventory <piece> --output <id>`** takes what a command really printed from stdin (`<the command> 2>&1 |
  …`), tidied to a few lines; `--set id.field=value`, `--keep`, `--remove` and `--must` are the agent's edits.
  `piece review <piece> inventory` refuses while an item is incomplete, and says how to finish each one.
- **Content** (the piece's inventory, the second half of What it says), written for people who do not code: items are sorted into what we say, what we show, what proves it and how it works, each named in
  everyday words with its source and a sample of how it could look; no kind, field or block names. There the
  user keeps or removes each proposal, marks what must appear, corrects a value or a list by hand and adds a
  line or a figure of their own; it cannot be approved while a proposal waits or a kept item is incomplete.
  Every edit reaches the agent. A piece started before gets it as already approved.
- **How each thing is shown is the user's to choose.** In Content, the samples of the blocks that can show an item
  play when pointed at, and a sheet per item plays the chosen block live with the user's own content in their
  brand (the scene itself, served by the studio, not a render). There they pick another block, tune its settings
  (a direction, a ratio, how close the camera stops) and choose the background behind it, from the brand's set or
  a new one from the library, each playing live on hover. The pick and the tuning are saved on the item (`show`,
  `tune`); the plan uses that block for it and `chain init --plan` writes the settings into the part.
- **A new block, `line-in` (A sentence):** one sentence in the brand's display type, arriving in one of the
  library's eight text entrances (rise, focus, scramble, type, track, flip, pop, bar), the marked words in the
  accent. Its `repeat` field lets a piece use it several times, each with a different entrance: the planner gives
  every sentence its own unless the user chose one, and spreads extra sentences through the piece instead of
  stacking them. So three kept sentences are three different moments, not one.
- `plan` also fills the length asked with what the user kept and no slot took, while it fits.
- In Content, the ways a kind of thing can be shown appear once per group, not under every row; each row only
  says how it is shown, and the page says how many moments the brief's length holds. A setting whose choices
  have samples (a sentence's entrance) is chosen in the sheet by watching each one.
- Scenes opened with `?embed` play and loop without the player's controls, for showing one inside another page.
- Items carry a `status` (`proposed`, `removed`, or none for kept). `plan` uses only what was kept and says how
  many proposals are still waiting.
- **`needs` on every block and shot**: the content it shows, by kind (a figure, a change, a screen, a command, a
  line…), and how that content maps onto its CONFIG. Published in `registry.json` and each resource's file.
- **`inventory <piece>`** checks `pieces/<piece>/inventory.json` (the list of what the piece can really show, each
  item with its kind and its source) and says which blocks show each item and what is missing: nothing shows the
  product, nothing proves it, a kind no block shows yet. `inventory kinds` lists the kinds and their fields.
- **`plan <piece> [--seconds n]`** proposes up to three structures from the inventory, the same content in three
  orders (show first, problem first, proof first). No item is shown twice, no block plays twice, every `must` is
  in, no beat runs shorter than its land and none longer than its scene. It writes `plan.json` and prints the
  structure board to share.
- **`chain init <piece> --plan <letter>`** installs the chosen structure with the inventory's content already in
  each part's CONFIG, and records in `chain.json` which items each part shows.

The studio always says whose turn it is, and never plays a video that is out of date.

- **`piece ask <piece> "question"`**: run before asking the user something in the chat. The studio shows the
  question in a bar across the top with a button back to the agent's app (found from the CLI's own process tree
  on macOS; `--return <url>` or `PAPER_MOTION_RETURN` for an agent in a browser). Cleared by the next `piece
  review` or `piece working`, or `--done`.
- **A turn bar in the studio**, also in the tab's title: your turn (and whether the agent is waiting for it), the
  agent working and for how long, a board waiting, a join in progress, the agent not having read the last
  changes, the studio itself stopped. Commands that wait (`piece review`, `board`) say so while they wait.
- **Stale videos are held.** Each joined render records what it was made from. When the piece changes (a text, a
  length, the order, a join, a scene the agent rewrote), Your video or the final stops, dims and says
  "Updating" with the part being rendered; Approve waits for the new one.
- **The studio joins the draft again by itself** after an edit by hand, with the sound the draft was made with.
  The agent is only called when the join fails. An edit after the final render sends Final back to the agent.
- Fixed: editing a text while in Assembly left the old film in place and told no one; clearing a part's length
  set it to 0.5 s; a part edited by hand in a piece past Parts had to be approved again.

From a test where an agent with no context made a video from `llms.txt` alone:

- `board --url`: option and look values may hold several keys and lists (`graphite:accent=#B8F03C,ramp=["#0A0A0B","#B8F03C"]`, `--look "acid-night:figure=#FFF,muted=#7E8079,geist"`); `--look brand` uses the palette, colors and font pair the project installed.
- `board --await <id> [--wait minutes]` waits (again) for the choice on a board already shared, for shells that cap how long a command runs.
- The studio lists the boards shared while a piece is open, in Your video, with a button to open each and the choice once made (`board --piece <name>` picks the piece when there are several).
- A chosen transition can be the join between two parts of a chain: `"join": "wipe"` (also crossfade, push, zoom-through, iris, slices, flash, scan-reveal, mask-reveal, glitch, cells, flip-3d).
- A tuned palette retunes its ramp (the steps between ground and accent follow the new accent); a background recolored into a palette takes the brand's ground behind everything.
- `chain --check` warns when the total drifts from the brief's length.

From a second test, an agent following the site's "For agents" page alone:

- `piece review` refuses while an earlier stage is not approved, and names the one to review first. It used to mark the earlier stages approved on its own. `--skip` moves on without them, for when the user agreed.
- `chain init --board <link>` looks the board up on the server of the link it is given (a bare id still uses `--site`, or the default site); the error says what to pass.
- After `chain init`, the next steps printed are the real ones in order: check each part's CONFIG, `--check`, `--drafts`, `--draft`, the full render, and `piece review <piece> video` when a piece is open.
- `chain.json` takes the open piece's title, not the board option's.
- `piece --help`, `chain --help` and `board --help` list every flag of their commands.
- `pamo --version`. Help says `--wait` is in minutes; the docs say `pamo` means `npx paper-motion`.

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
