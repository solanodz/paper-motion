# Studio v2 · plan

Status: **built** (2026-11-13): phases 0–5 done, released as 0.5.0; acceptance 10 is measured as 0 shader draws and 0 animation frames once a scene ends, with at most one live preview. Left for later: **Take them from my logo**. Implements [spec-studio-v2.md](./spec-studio-v2.md) (approved,
D1–D4 as recommended). The clickable demo is `works/studio-v2-demo/` (run it with the `studio-v2-demo` preview).

## Approach

- **Five phases, each shippable on its own.** The studio keeps working after every phase, and each phase ends with its
  acceptance checks passing. The order puts the worst pain first: the agent connection, then the one-page flow.
- **The files stay the source of truth** ([ADR 0001](./adr/0001-brand-folder-is-the-source-of-truth.md)). The studio
  writes `brand/`, `pieces/<piece>/piece.json`, `chain.json` and part CONFIGs as it does today. The agent reads every
  change as a line.
- **No new dependencies.** It uses the same local server, the same page (plain HTML and JS), and the same `pamo`
  commands, plus one new one.
- **An automated check** drives a fresh project end to end in headless Chrome with a scripted agent. Each phase adds
  its acceptance checks to it, so later phases can't break earlier ones.
- **Tested on copies, never on the user's open pieces.**

## Phase 0 · Groundwork

| | Task | Files |
|---|---|---|
| 0.1 | ADR 0005: while a piece is open, the studio replaces board links; boards on the site stay for when no piece is open. | `docs/adr/0005-…md` |
| 0.2 | Glossary: **Step** (what the user sees), **Scene** (a part, as the studio names it), **Choice** (options the agent puts into the studio). Update **Studio**. | `GLOSSARY.md` |
| 0.3 | `scripts/check-studio.mjs`. It makes a temp project, runs `pamo piece init`, starts the studio, drives the page in headless Chrome and plays the agent's side with real `pamo` commands. It prints one ✓ or ✗ per acceptance check. | `packages/engine/scripts/` |

Done when the check runs, and passes today's flow (brief → content → video → export).

## Phase 1 · An honest connection with the agent

Covers acceptance 6, 7 and 8.

| | Task | Files |
|---|---|---|
| 1.1 | `pamo piece listen <piece> [--wait 9]`. It beats every 3 s while waiting, and exits on the first event that needs the agent: a message, an answer, an approval, or a choice the agent offered. It prints the unread lines, the same as `review`, and marks them read. After `--wait` minutes it exits with code 3 and "nothing yet". | `lib/piece.mjs`, `bin/pamo.mjs` |
| 1.2 | Read receipts. When the `seen` cursor moves, record `seenAt`; each event is read if `n ≤ seen`. `/api/piece` returns, for each message, `sent` and `read` times. | `lib/piece.mjs`, `lib/studio.mjs` |
| 1.3 | The four states, only from facts: **listening** (a beat < 9 s with `waiting`), **working** (`piece working` and a beat < 9 s), **asked you** (an open `ask`), **not connected** (anything else). Remove "Your agent waits while you edit" and "tell your agent continue" unless they are true. `piece working` starts a beat that lasts while the agent's commands run (a short-lived marker each command refreshes). | `studio/index.html`, `lib/studio.mjs`, `lib/piece.mjs` |
| 1.4 | Questions. `piece ask` shows the question with an answer box. **Answer** writes an `answer` event (decisive for `listen`) and closes it. **Answered in the chat** closes it with no event. Any `review`, `working` or `ask --done` also closes it. | `studio/index.html`, `lib/piece.mjs` |
| 1.5 | Ask your agent becomes a thread: your messages with **Sent** or **Read 15:32**, and the agent's replies. New: `pamo piece say <piece> "…"` posts a short reply into the thread. | `studio/index.html`, `bin/pamo.mjs` |
| 1.6 | Skill and agent guide. Keep `pamo piece listen <piece>` running in the background between turns; when it exits, read its lines, act, and start it again. Reply in the studio with `piece say`. Without background commands, say so to the user once. | `skills/make-video/SKILL.md`, `lib/registry.mjs` |

Check: a scripted agent goes off → listen → asks a question → answers. The page shows each state within 9 s. The
message turns Read once `listen` prints it. "Waiting" never appears while no command is running.

## Phase 2 · One page, four steps, and How it looks

Covers acceptance 1, 2 and 4.

| | Task | Files |
|---|---|---|
| 2.1 | A new stage, `look`, between `inventory` and `video`. `STAGES` becomes brief, inventory, look, video, final. Older pieces get it approved on read (`upgrade`). A project that already has colours, type and a background gets it approved when created. | `lib/piece.mjs` |
| 2.2 | The stepper: **What you want to say** (brief + inventory) · **How it looks** · **Your video** · **Export**. It shows a check when a step is done and a dot when the agent left something there. Steps ahead are locked until reached; earlier ones can be reopened. One address throughout. | `studio/index.html` |
| 2.3 | Look options. `/api/piece` returns palettes, font pairs, backgrounds and movement (pace and entrances), matched to the brand's facts, each with what the card needs. Cards are still: a colour swatch, a type specimen, a background poster. | `lib/studio.mjs` |
| 2.4 | Background posters. Render the missing stills (`previews/<id>.jpg`) for every background in the registry, so cards never run a shader. | `registry`, `apps/web/public/previews` |
| 2.5 | The live look preview. A single iframe plays the `line-in` block with the user's first sentence and name. `runtime/brand.js` takes a look override from the address (`?look=<base64 json>`: colours, fonts, background entry, pace, entrance), only for embedded previews. Pointing at a card changes the override; nothing else plays. | `runtime/brand.js`, `lib/studio.mjs`, `studio/index.html` |
| 2.6 | Choosing writes `brand/` with the existing edits: palette and font through `editStyle`, colours one by one, a library background through `/api/background`, pace and the default entrance in `brand/motion.json`. Undo covers them. **Take them from my logo** reads the wordmark's colours. | `lib/edit.mjs`, `lib/studio.mjs` |
| 2.7 | **Next: make my video** approves `look` and builds the first version, as Make my video does today. | `lib/studio.mjs` |

Check: from content to look to video in one tab. A palette, a font pair, a background and a pace picked by watching
land in `brand/`. An old piece opens with look approved.

## Phase 3 · Choices from the agent

Covers acceptance 3.

| | Task | Files |
|---|---|---|
| 3.1 | When the project's studio is running and a piece is open, `pamo board --url …` writes the board into the piece (`choices[]`: the board, where it belongs, status) instead of making a link. It prints "in the studio, on How it looks · Colours". `--link` forces a site link (to share it). | `bin/pamo.mjs`, `lib/piece.mjs` |
| 3.2 | Where each choice goes, by type: palette → Colours, font pair → Type, background → Background, text move → Movement, structure or recipe → Your video (as a whole-video option). Kits split into their parts. | `lib/studio.mjs` |
| 3.3 | The page shows **Your agent suggests…** first in that section, with the agent's note and **Suggested by your agent** on each card, and a dot on the step. | `studio/index.html` |
| 3.4 | Picking writes the choice and builds the same reply line with `replyLine` from `live-board.js`. `board` waits on the piece (beating as listening) and prints that line, so skills need no change. **None of these** with a note works too. | `bin/pamo.mjs`, `lib/live-board.js` |
| 3.5 | `board --await <id>` and `board --forget <id>` work for studio choices too. | `bin/pamo.mjs` |

Check: the scripted agent offers three palettes. They show as suggested with no link printed. Picking one prints the
reply line in the agent's command, and the palette is in `brand/`.

## Phase 4 · Your video as scenes

Covers acceptance 5 and 9.

| | Task | Files |
|---|---|---|
| 4.1 | Replace the horizontal track with the scene list on the left: number, still, one line, length. Drag to reorder; **＋ Add a scene** at the end. | `studio/index.html` |
| 4.2 | Scene stills from the user's real scene, not the library sample. After a part changes, render one frame (`pamo still --t`) into `pieces/<piece>/.stills/<dir>.jpg`, one at a time, queued, in the studio's own browser. The list shows the library poster until it's ready. | `lib/studio.mjs`, `lib/edit.mjs` |
| 4.3 | Panel tabs renamed and reordered: **Text** (words), **Animation** (motion, by watching), **Background**, **Speed** (length is speed, as in 0.4.1), **Next scene** (the join). | `studio/index.html` |
| 4.4 | The player stays one live iframe: plays once, holds, click to replay (as in 0.4.1). **Play the whole video** moves on at each `ended` (as in 0.4.1). | `studio/index.html` |
| 4.5 | **Add a scene** asks what it is for and offers scenes already filled with something kept (today's add sheet, in the new layout). **Show it another way**, **Duplicate**, **Remove** and **Undo** stay. | `studio/index.html` |
| 4.6 | Editing content after the video exists never rebuilds by itself. A new kept item offers **Add it to the video** (as a scene, by intent). | `studio/index.html`, `lib/studio.mjs` |

Check: the scripted session edits words, animation, background, speed and the transition, moves a scene, adds one and
undoes it. The joined draft and the final match the list, in order and length.

## Phase 5 · Performance, docs, release

Covers acceptance 10.

| | Task | Files |
|---|---|---|
| 5.1 | One live iframe on the page at a time. Hover clips use one shared `<video>`. A scene that ended stops its loop: with the page idle, there are no animation frames and no shader draws. | `studio/index.html`, `runtime/player.js` |
| 5.2 | The check measures it: after a scene ends, 0 shader draws a second for 5 s; at most one live iframe at any moment. | `scripts/check-studio.mjs` |
| 5.3 | Docs: the skill's stage table and studio section, the agent guide (`llms.txt`), the glossary, the site's docs page and making-of (the four steps' names), and the CHANGELOG. | `skills/`, `lib/registry.mjs`, `apps/web` |
| 5.4 | Release **0.5.0**, a minor version because of the new `look` stage and the new commands. Deploy the site first, then `npm publish`. | `packages/engine/package.json` |

## Acceptance → where it is built

| Spec acceptance | Phase · tasks |
|---|---|
| 1 One address, no other link | 2.2, 3.1 |
| 2 Content, then Next | 2.2, 2.7 |
| 3 Agent's palettes in the studio, reply line printed | 3.1–3.4 |
| 4 Type, background, pace by watching, written to `brand/` | 2.3–2.6 |
| 5 Scenes in a list; every edit; undo | 4.1–4.5 |
| 6 Not connected → message Sent → listen → Read | 1.1–1.3, 1.5 |
| 7 Question answered in the studio wakes the agent | 1.1, 1.4 |
| 8 Never "waiting" without a running command | 1.3 |
| 9 Final matches the list | 4.4, 4.6 (with the 0.4.1 timing) |
| 10 Idle CPU under 10% | 5.1, 5.2 |

## Risks

- **Agents that can't wake on a background command** (some editors' agents). The studio says "Not connected"
  honestly, and the user goes back to the chat. That's the fallback, not a bug.
- **Two writers on `piece.json`**: the studio and a waiting `listen` or `board`. Every write already goes through
  `updatePiece`, which re-reads first. The check runs both at once.
- **The look override in the address** must never reach a render. Renders don't pass `?embed`, and the override is
  read only together with it.
- **Stills rendering competes with the user's machine.** One at a time, half resolution, only after changes, and
  skipped while a final renders.
- **Older pieces** (the user's `site`): `upgrade` adds `look` as approved. Phase 2 is tested on a copy of `site`
  before release.

## Order and size

The phases run in order, and each is reviewed by the user in the running studio before the next one starts. Rough size:

| Phase | Size |
|---|---|
| 0 | small |
| 1 | medium |
| 2 | large: the new step and its preview |
| 3 | medium |
| 4 | medium |
| 5 | small, plus the release |
