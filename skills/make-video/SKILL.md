---
name: make-video
description: "Make one video (a piece) for a brand, from brief to final render, with Paper Shaders: launches, explainers, social loops, end cards, README loops, animated posters, moving artwork. Use when the user asks for a video, loop, reel, promo, motion piece or anything that moves, even if they never say \"shader\" or \"Paper\"; it takes the look, motion, sound and material from brand/ when it exists."
---

# make-video

You and the user make one piece of moving image together. You are the studio: you propose, render, look critically and refine. The user is the director. The medium: an HTML **scene** that is a pure function of time `t`; Paper Shaders give the material, DOM/SVG/CSS the type and geometry, and the engine renders every frame in headless Chromium and encodes it with ffmpeg, so output is exact and repeatable.

`pamo` is shorthand for the paper-motion engine CLI: type it as `npx paper-motion` (the npm package `paper-motion`; the bare npm name `pamo` belongs to an unrelated package), or `node packages/engine/bin/pamo.mjs` inside the paper-motion repo itself, run from the user's project root. First time on a machine: `pamo setup` (Node ≥ 18, ffmpeg, Chrome); if it fails, read `references/rendering.md` → Troubleshooting.

## 1 · Read the brand

Read `brand/`. Each file is a decision you build on, not a question to ask again:

| File | Gives the piece |
|---|---|
| `IDENTITY.md` | what to say and how (voice, words, Facts: the only true claims you may write) |
| `tokens.json`, VISUAL.md | colors by role, typefaces and type scale, shape, wordmark files |
| `motion.json`, MOTION.md | pace, camera, text behavior, the transition repertoire, how color enters, the ending |
| `sound.json`, SOUND.md | the cue for each gesture, typing, the low-pass, loudness |
| `shader-set/set.json` | the material: entries to mount by id |

Scenes load it with `paper-motion/brand` (see "Writing a scene"). When a part is missing, either offer its skill (`identity`, `visual-system`, `motion-style`, `sound-kit`, `shader-set`) or settle it inside this piece's intake with one question and a recommendation; never block on it. With no brand folder at all, the full intake below decides everything for this piece.

## The studio: where the user decides (the default)

Every piece runs through the **studio**, a local page where the user sees each stage of the piece, approves it or asks for changes, and edits by hand what needs no judgment (the brief, the words on screen, lengths, joins, order). Start it as soon as you know the piece's name, before the intake; you hand each stage over and wait for their decision, which arrives on its own (never ask them to paste anything). Only when the user can't open a browser, run the same stages in the chat with the gates below.

```bash
pamo piece init <piece> --title "…"             # piece.json, and the project's studio in the background
pamo piece init <piece> --what "…" --who "…" --format "…" --tone "…" --action "…"   # the brief, after the intake
pamo piece review <piece> brief                 # opens the studio for them the first time; waits; prints what they did
```

`pamo studio --stop` ends the background studio when the piece is done.

**Listen between your turns, so the user never has to come back to the chat.** The user is usually looking at the studio, and the studio only says what it can check about you. Keep this running in the background whenever you are not working on the piece:

```bash
pamo piece listen <piece>        # returns as soon as the user needs you; exit 3 after 9 min with nothing: start it again
```

It prints what they did as lines (`changes: "…"` from Ask your agent, `answered "…": "…"`, an approval, a choice) and marks them read, so they see **Read** in the studio. Act on the lines, then start it again. If your app cannot run a command in the background and come back when it exits, tell the user once that you hear the studio only when they write to you in the chat; the studio then honestly shows you as not connected.

- Before you start working on something, say what in plain words: `pamo piece working <piece> <stage> --on "new words for the ending"`. The studio shows it with how long; it ends when you listen or review again, or after 20 minutes.
- To ask the user something, run `pamo piece ask <piece> "<the question in one line>"` and ask it in the chat too. The studio shows it with a box to answer it there; their answer reaches `piece listen` as an `answered` line. It closes when they answer (in the studio, or with Answered in the chat), with your next `piece review` or `piece working`, or with `piece ask <piece> --done`.
- To answer the user in the studio, `pamo piece say <piece> "Done: the ending is warmer now."`: it shows in their thread under Ask your agent.
- When you run in a browser instead of a local app, add `--return <the URL of this chat>` to `piece init`, so the studio can link back to you.

The user sees four steps on one page: **What you want to say** (the brief and the inventory), **How it looks**, **Your video** and **Export**.

| Stage | What you do before `piece review <piece> <stage>` |
|---|---|
| brief | fill the five fields from the intake (`init`, or write `piece.json`) |
| inventory | `pamo inventory <piece> --from <their site> --from README.md --from brand` gathers what they already have as proposals; drop the noise (aim for 6 to 8 things worth showing), add what only you can find (a real command's real output, a figure from their docs), fill what a proposal still needs. The user keeps or removes each one, stars what must appear and corrects the words. When they press **Next**, they move on to How it looks |
| look | nothing to prepare when the brand already settles colours, type and a background (the step opens done). Otherwise the user chooses them there, by watching their own first sentence: colours, type, background, pace and how words arrive, each written to `brand/`. **Make my video** builds the first version (the planner's first structure, every part filled with its content) |
| video | nothing to prepare: the studio built it. The user sees its scenes in a list (each with a still of itself) and edits the selected one in five tabs (Text, Animation, Background, Speed, Next scene); nothing rebuilds by itself, and new content is added as a scene. While it is in review the user edits it themselves, live: every part's words and numbers, how a sentence arrives, its background (or one new from the library), its settings, its length, the transition after it, the order; they add parts by intent, show a part another way, duplicate or remove it, and change the whole video's colours, type and pace (Style, which writes `brand/`). Every change reaches you as one line; read them, they are the user's decisions. Do only what they ask for in **Ask your agent** (a `changes` line): new copy, a part no block makes, a picture you must find |
| final | the user renders it from the studio (full quality, motion blur, sound); or you run `pamo chain <piece> --motion-blur 5` (and other formats if asked) |

Read every line `piece review` prints and act on it before the next review: `changes: "…"` on a stage or a part is a request (mark the stage yours with `pamo piece working <piece> <stage>`, fix it, re-render: `pamo chain <piece> --drafts --only <dir>` for one part, then review again); `brief action="…"`, `url="…" (re-rendered)`, `seconds=…`, `order …` are edits the user already made (the studio wrote them into `piece.json`, the part's CONFIG or `chain.json`, and re-rendered the part): build on them, never undo them. After an edit by hand the studio joins the draft again by itself (`(the studio is joining the draft again)`): do nothing for those. A line ending `join again` means it could not, or the assembly is stale for another reason: `pamo chain <piece> --draft`, then review video again. A line ending `the final is out of date` means the user edited the piece after the final render: render the final again, then review final. While a video is being replaced the studio holds it and does not let the user approve it. `pamo piece status <piece>` shows where everything stands and what you haven't read. `piece review` refuses while an earlier stage is not approved: review that one first; pass `--skip` only when the user agreed to move on without it. Without a browser, the gates below are the same stages run in the chat.

## 2 · Intake: recipe, format, brief (mandatory)

**Do not build anything until the brief is approved.** Call `interview` with the question bank in `references/intake.md` (it skips what the brand already settles, and what the user already answered to the short interview in `llms.txt`: the one-line what, purpose and format, colors, feel, the action; never ask those twice) and write `brief.md` from its template. Visual decisions in the intake (palette, type, backgrounds, the moves to use, the recipe) go through **boards**: when the user can open a browser, a live board (`pamo board --url`, see `references/boards.md`), a link they open to compare the options in their own look, tune one and choose; otherwise a rendered board. You propose, they choose; never pick a look for them from a description.

- **Named resources (paper-motion.app).** When the user names resources ("backgrounds mesh-sage and grain-slate, effects magic-move and whip-pan", "use paper-motion.app") or wants to browse, read https://paper-motion.vercel.app/llms.txt (or `pamo search <words>`, `pamo list <type>`), confirm the picks in the brief, then install them with `pamo add <id> [<id>…]`: moves land in `moves/` as editable code, backgrounds in `brand/shader-set/set.json`, palettes and font pairs in `brand/tokens.json`, recipes in `pieces/<id>/`. Adapt them through their params; never re-implement a move the registry has.
- **Recipe:** start from one in `references/recipes.md` (launch, explainer, social loop, end card, README loop) or the user's own structure; `pamo add <recipe>` writes a working scene for it, wired to `brand/`. A recipe gives beats and timing, never a look. The user's length wins: scale the recipe's beats to it.
- **Inventory (before any structure):** write `pieces/<piece>/inventory.json`, the list of what this piece can really show: `{ "items": [{ "id", "kind", …fields, "source", "must"? }] }`. `pamo inventory kinds` lists the kinds (figure, change, share, series, table, screen, action, form, search, command, code, line, variants, words, voice, logo, music…), their fields and the blocks that show each. Gather first: `pamo inventory <piece> --from <url> --from README.md --from brand` reads the user's site (and screenshots it on a desktop and a phone into `brand/assets/`), a markdown file, a folder, or the brand (IDENTITY.md's Facts and `brand/assets/`), and writes what it finds as **proposals** (`"status": "proposed"`), each with its `source`; run it again any time, it never proposes twice what is already there or what the user removed. A proposal copies what is written or shown, nothing more: read every one before the user does, drop the noise (`--remove id,…`), fill what the report says an item still needs, and add what gathering cannot see. A command found in a README has no `output` until it is run: run it yourself and pipe what it really printed, `<the command> 2>&1 | pamo inventory <piece> --output <id>` (never invent an output); `--set id.field=value` changes any other field. `piece review <piece> inventory` refuses to hand over while an item is incomplete: the user is asked whether each thing is true, and cannot judge half of one. Nothing goes in that is not true. Add `--plain` when the people the brand talks to do not code: commands and code are then left out, whatever its files hold. Then `pamo piece review <piece> inventory`: in the studio (where this stage is called **Content** and every item reads in everyday words: a sentence, a number, a screenshot, with a sample of how it could look) the user keeps or removes each proposal, marks `must` what has to appear, corrects a value or a list by hand (one entry per line) and adds a line or a figure of their own; the stage cannot be approved while a proposal waits. For each item they can also open a sheet that plays the block **live with their own content, in their brand** (the studio installs it under `pieces/<piece>/.try/`, yours to ignore), pick another block that can show the same thing (samples play on hover), tune that block's settings, and choose the background behind it from the brand's set or add a new one from the library (it goes into `brand/shader-set/`, in the brand's colours). Their pick (`show`), their settings and their background (`tune`) are saved on the item: the plan uses that block for it, and `chain init --plan` writes those settings into the part. Never override them; if a pick cannot be used (two items ask for the same block in one structure), say so. A block with `repeat` in the registry (`line-in`, a sentence) may play several times in one piece, each time with a different value of that setting: the plan gives each use its own (shown in its output as `line-in (scramble)`), so several sentences become several distinct moments. A plan is made only of what they kept. `pamo inventory <piece>` checks it and says what is missing (nothing shows the product, nothing proves it, a kind no block shows yet): ask the user for those before planning. Then `pamo plan <piece> --seconds <n>` proposes up to three structures, the same content argued in three orders (show first, problem first, proof first), each beat a block that shows one item, played whole at a speed it can take. The user chooses on the board; `pamo chain init <piece> --plan <letter>` installs the parts with the content already in each CONFIG, so what is left for you is judgment (which word carries the line, where the camera rests), not typing. Without an inventory you are choosing blocks by mood: do not.
- **Real material:** ask what is real and can be shown, and use what `brand/assets/` already holds: photos of the product or place, the product's UI, a real command and its output, the music, the cover art, real numbers from the Facts. A piece that shows the real thing beats any abstract illustration of it; run photos through image shaders (HalftoneDots, ImageDithering, PaperTexture, FlutedGlass) to make them the brand's.
- **Format:** 16:9 (1920×1080), 9:16 (1080×1920) or 1:1 (1080×1080). One piece, one format; another format is another piece, made after this one.
- **Never choose a look for the user.** Palette, font pair, background(s), the moves by role (enter, swap, text) and the recipe each go through a board, in that order, unless `brand/` already settles one; say so when you skip. Let them pick several moves where a piece needs several (`--choose 1-3`). **While a piece is open and its studio runs, a board goes into the studio, not into a link** (ADR 0005): the same `pamo board --url …` prints where it shows ("in the studio, on How it looks · Colours") and waits for the pick, printing the same reply line; a palette, font pair or background the user picks there is already applied to `brand/`, so you only read the line. Nothing to share; add `--link` only when the user wants a link (to send it to someone).
- **Everything they chose gets used.** Every move the user picked appears in the piece and `brief.md` says where it plays (a chosen transition can be the join between two parts: `"join": "wipe"` in `chain.json`, or be built inside a part); a recipe's own moves are placeholders to swap for theirs.
- **Mirror back** after each round; get an explicit approval of `brief.md`.
- When a gate is later rejected, ask what exactly was wrong (pace, type, composition, movement, transitions, sound, mood) before changing anything.

**Clarity first.** A piece is seen mostly by people who have never heard of the brand. Every piece says, in plain words and within its first third, **what the brand is** ("a sourdough bakery in Madrid", "the debut EP of an ambient producer"), taken from IDENTITY.md's In one line and Offer; a witty or poetic line may sit beside it, never replace it. Every piece ends on **one clear action**: where to go, when it comes out, where to listen or buy. Names that only insiders know (a neighbourhood, a track, an internal term) appear with their context ("Lavapiés, Madrid") or not at all. Write the *what* line and the action into `brief.md` before anything else.

Guessing is the failure mode of this job. Keep asking until you could describe the piece second by second and the user would agree. Only an explicit "surprise me" skips ahead, and even then style frames come first.

## 3 · Gate A: style frames

Before the frames, settle what they are made of with live boards when the brief left it open (a background, the repertoire of moves, the recipe): `references/boards.md`. The style frames themselves are renders of this piece, not boards.

From the approved brief, make 2–3 stills of the key moments at final quality, in the brand's look:

```bash
pamo new <name> --dir brand/pieces --format 9:16 --piece   # a scene already wired to the brand
pamo still brand/pieces/<name>/scene.html --count 4        # stills + contact-sheet.jpg
```

Every piece gets a storyboard before building: one central idea that carries the whole piece (a continuous camera through the product, a terminal that becomes the brand, a material that transforms), and one distinct mechanic per beat tied to what that beat says. A run of title cards joined by crossfades is a slideshow, not a piece: never run every beat through the same arrive-and-hold treatment. Get the storyboard approved before building.

Look at every contact sheet yourself before showing it (`references/aesthetics.md` is the composition and critique guide), and run the **stranger test** first: someone who has never heard of this brand watches it once. Do they know what it is, and what to do next? If not, fix that before anything else. Show the sheets with one line each; let the user pick, mix or redirect.

## 4 · Gate B: test shot

Render the most important 3–8 seconds at final quality, with the brand's moves and sound:

```bash
pamo render brand/pieces/<name>/scene.html --to 6 --motion-blur 6 --dpr 2 --out brand/pieces/<name>/renders/test-shot.mp4
```

Get an explicit OK on pace, movement, look and sound.

## 5 · Gate C: build the full piece and iterate

1. Edit `scene.html`; record each decision in `brief.md` (Decisions log).
2. `pamo still` at the moments that matter and critique the frames yourself first: legibility, edges, balance, contrast, banding, does it still feel like the brief and the brand.
3. Show stills; for motion, a short draft render or `pamo preview brand/pieces/<name>/scene.html` (live reload, scrub with ←/→).

Change one or two things per round and say what changed. Keep what the user liked.

**A piece made of blocks** (the user chose a structure whose beats name blocks or shots, or a few blocks in order) is a chain, not one scene written from scratch:

```bash
pamo chain init <piece> --board <id|link> --option D --format 1920x1080   # or --parts search-type:4,bar-grow:3.5,svg-logo:5
# write each part's CONFIG in pieces/<piece>/<nn>-<id>/scene.html from its beat (chain.json lists the "what")
pamo chain <piece> --check                                                  # windows, joins, and parts cut before their land
pamo chain <piece> --motion-blur 5 [--audio track.wav]                      # → pieces/<piece>/renders/<piece>.mp4
```

`chain.json` holds each part's `seconds` (and `from`) and how it comes in: `join` is `whip` (default: a sideways slide with a motion smear), `cut`, `dissolve` or `dip` (out to the brand's ground and back). Every part loads `brand/`, so the piece is in the brand's colors and type; run it from the project root. A part always plays its whole scene, never cut and never looped: its `seconds` set its speed (shorter plays it faster, longer slower), between 1.6× faster and 0.6× slower than the scene's own length; a length outside that range is held at the limit, with a warning. A scene whose length depends on its content (Beat cuts: one beat per word) ends on its last word. Iterate per part with `pamo still` on its own scene; after adding a part to `chain.json`, `pamo chain init <piece>` installs only what is missing.

## 6 · Gate D: render the final

```bash
pamo render brand/pieces/<name>/scene.html --motion-blur 8 --dpr 2 --loudness <sound.json's loudness>
pamo render brand/pieces/<name>/scene.html --format prores                          # master for editing
pamo render brand/pieces/<name>/scene.html --format gif --gif-width 720
pamo render brand/pieces/<name>/scene.html --audio track.wav --loudness -14         # with the user's music
```

Renders land in `brand/pieces/<name>/renders/`. Check the first and last frame of a loop (`pamo still --t 0,<duration − 1/fps>`). Report the file path, size, duration and the loudness `render` measured.

## Writing a scene

Minimal shape, wired to the brand (full API: `references/scene-api.md`):

```html
<main id="stage"><div id="bg" style="position:absolute;inset:0"></div><div id="title" style="position:absolute;left:96px;bottom:160px"></div></main>
<script type="module">
  import { scene, progress, ease } from 'paper-motion';
  import { wordRise, typingTimes, typeOn, keySounds } from 'paper-motion/moves';
  import { loadBrand } from 'paper-motion/brand';
  const B = await loadBrand();
  const s = scene({ width: 1080, height: 1920, fps: 30, duration: 12, background: B.color('ground') });
  B.shader(s, '#bg', 'mesh-ground');                       // an entry of the brand's shader set
  const title = B.style(document.querySelector('#title'), 'display');
  title.textContent = B.name;
  s.update((t) => wordRise(title, t, { start: 1, each: B.pace.stagger }));
  B.cue(s, 'text', 1);                                     // the brand's sound for text landing
  B.sound(s);
  await s.start();
</script>
```

Hard rules (break them and frames flicker or differ between renders):
- **Everything derives from `t`.** No `Date.now()`, `performance.now()`,
  `Math.random()`, `setTimeout`, `setInterval`, or self-running rAF loops. Use
  `rng(seed)`, `noise()`, `keys()`, `progress()` from the runtime.
- CSS animations/transitions *are* allowed: the runtime pauses them and sets
  their time to `t` every frame. Prefer `s.update` for anything important.
- Don't add your own `<script type="importmap">`; the engine injects one.
- Brand assets are read from `/brand/…` (serve from the project root); piece assets go in the piece folder and are
  referenced relatively. Web fonts need network at render time; font files in `brand/assets/fonts/` are safer.
- One `scene()` per page; call `await s.start()` last.

## Shaders

30 Paper shaders, all usable by name with the same props as their React
components. `references/shaders.md` lists every one with defaults, enum options
and named presets — start from a preset, then tune. Quick live list:
`pamo shaders` · details: `pamo shaders MeshGradient`.

- "still" shaders (Waves, DotGrid, StaticMeshGradient, PaperTexture, image
  filters) don't move by themselves: animate them by driving params from `t`.
- Image shaders (ImageDithering, HalftoneDots, HalftoneCmyk, FlutedGlass,
  Water, PaperTexture, LensDistortion, LiquidMetal, GemSmoke, Heatmap) take
  `image: 'photo.jpg'` — a great way to turn the user's own photo or logo
  into a piece.
- Seamless loops of diffuse fields: `s.shader(el, name, params, { loop: 2 })`
  crossfades the last 2 s into frame 0. Not for crisp shapes (they ghost).

## Paper Desktop (optional)

If the Paper Desktop MCP is connected, it can host **Gate A**: build the style frames on the user's canvas, let them
tune shaders and leave comments by hand, then read the exact values back with `get_jsx`. The workflow, tools and the
free-plan budget (100 calls a week) are in `references/paper-canvas.md`. Nothing in this skill requires it.

## Bundled examples

`pamo examples` — deliberately different pieces shipped with the engine;
it prints the folder they live in (copy one with `pamo new <name> --from <example>`): `breath` (warm field), `signal` (dithered
sphere), `install-loop` (terminal typing over a seamless shader loop) and
`chrome-endcard` (LiquidMetal wordmark, mask wipe, sound cues). Read them to
learn the API; start from one with `pamo new <name> --from breath` only
if the user wants that direction.
Never default to them.

## References

- `references/intake.md` — **read first**: the piece's question bank, vocabulary, brief template
- `references/boards.md` — boards: live (paper-motion.app links the user opens) and rendered; how to build one, read the reply line, and choose options with the registry's metadata
- `references/recipes.md` — beats and timing for launches, explainers, social loops, end cards, README loops
- `references/aesthetics.md` — composition, restraint, material, critique checklist (type and color craft live in `visual-system`, motion craft in `motion-style`, sound craft in `sound-kit`)
- `references/scene-api.md` — runtime API (scene, shader layers, timing, easing, noise, color, text)
- `references/shaders.md` — every Paper shader: params, options, presets
- `references/rendering.md` — formats, quality, speed, troubleshooting
- `references/sound.md` — synthesized sound effects (pen, paper, thud, drone…) mixed into renders
- `references/paper-canvas.md` — working with the Paper Desktop MCP
