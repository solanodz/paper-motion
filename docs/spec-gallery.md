# paper-motion gallery · spec: videos you can make, each with the prompt that made it

Status: **approved** (2026-11-14), with D1–D6 as recommended.

## Why

Four blind tests on 2026-11-13 ([bake-off results](./bake-off-results.md)) showed that paper-motion's engine,
studio and library didn't make an agent's videos better. Claude Code alone beat them. The one thing that helped was
**direction**: a second, blind look with concrete notes, then a revision. The lean retest (0.6) confirmed it: the
critic loop raises the floor, but a tool around it doesn't beat a good agent run.

So the value isn't in the tool. It's in knowing **what to ask for**: the timing, the material, the camera, the checks.
On 2026-11-14 we turned two reference videos into prompts. The user ran them in a fresh session, and both came out
well. That is the product: a prompt that reliably gets an agent to a video worth posting.

## Destination

paper-motion is a **gallery**. Each entry is:
- a video,
- the exact prompt that made it, ready to copy,
- fields that adapt the prompt to your brand (word, colours, voice-over),
- what you have to bring,
- how honest the result is: model, agent, date, how many cold runs and how many passed,
- the failure modes we saw, and what to do about them.

People (and their agents) come, pick a video, adapt the prompt and paste it into Claude Code, Codex, Cursor or any
agent that can run code and look at images. No package to install, no CLI, no studio.

## Principles

1. **Every prompt is verified cold.** It is run in a fresh session, with no help beyond what the entry says. An entry
   is published only if its runs reached the bar, and the numbers are shown as they are (a single run says `1/1`).
2. **The prompt is the whole recipe.** It carries its own timings, its own material notes and its own checks, so it
   works without anything from us.
3. **Direction is built in.** Every prompt ends with the same director's pass, as plain text: contact sheets, a blind
   critic in a fresh subagent, at most 6 notes with timestamps, a revision, at most two passes. It is the one thing
   that proved its value.
4. **Original pieces only.** Entries teach a technique (a bouncing logo, liquid-glass UI). They don't copy someone
   else's video, brand or screens. Every asset in a video is ours or credited under its licence.
5. **One page per video, nothing in the way.** The home is the gallery. The entry page is the video and the prompt.
6. **Agents are first-class readers.** Every prompt is served as plain text at a stable URL, and `/llms.txt` lists
   them all.

## What goes away

Everything that existed to be a tool: `packages/engine` (the `pamo` CLI and npm package), `skills/`, `registry/`,
`library/`, `examples/`, the studio, the boards, the MCP endpoint, the kit, the library pages and their API routes.
History keeps them: tag `v0.5`, branches `archive` and `lean`.

`docs/bake-off-results.md` (brought over from the `archive` branch) stays: it is the evidence behind this direction.

## The content model

One folder per entry, in the repo:

```
gallery/<slug>/
  entry.md        frontmatter (the facts) + the prompt + notes
  video.mp4       web encode, ≤ 8 MB, H.264, faststart
  poster.jpg      first good frame, 1280 wide
  contact.jpg     the contact sheet the run was judged on
```

`entry.md` frontmatter:

| Field | Example |
|---|---|
| `title` | Liquid glass intro |
| `summary` | One sentence on what you get. |
| `format` | `16:9` · `9:16` · `1:1` |
| `duration` | `28` (seconds) |
| `techniques` | `[kinetic type, glass material, camera moves, voice-over sync]` |
| `bring` | what the user must supply: `vo.wav`, a logo SVG, photos… |
| `variables` | `[{ key: brand, label: "Your word", default: "bouncy" }, …]` |
| `runs` | `{ tried: 1, passed: 1, model: claude-opus-5-5, agent: Claude Code, date: 2026-11-14, minutes: 40 }` |
| `credits` | each third-party asset with its licence |

Body sections: `## Prompt` (one fenced block, with `{{key}}` where variables go), `## Failure modes`, `## Notes`.
The director's pass lives once in `gallery/_director.md` and is appended to every prompt when it is shown or served.

## The site

All interactive pieces are built on **UI SDK** (`@ui-sdk/react`, headless). The look stays the approved system:
black ground, no radius, 1px rules, paper for the current thing, actions that invert, Geist Serif/Sans/Mono/Pixel.
Rich, not flat: autoplaying clips, a live shader in the footer wordmark.

**Home (`/`)**
- A short line on what this is, then straight into the grid.
- Filters: format (Segmented Control) and technique (Toggle group), plus search (Command, `⌘K`).
- The grid: each card autoplays muted when on screen, with title, format, duration and the runs tag (`1/1 cold`).

**Entry (`/v/<slug>`)**
- The video, large, with sound available.
- The prompt: the fields for its variables (Field + Input) fill the `{{key}}` slots live; Copy (Button) and a Toast.
- Facts row: model, agent, date, runs, minutes.
- Collapsibles: what to bring, failure modes, credits, contact sheet.
- Next/previous entry.

**For agents**
- `/v/<slug>/prompt.md`: the prompt as plain text with the director's pass, defaults filled in.
- `/llms.txt`: what this is, and every entry with its summary and prompt URL.
- README and AGENTS.md: what the repo is and how to add an entry (the cold-run rule included).

## The first entries

1. **Liquid glass intro** (16:9, 28 s): the user's run from 2026-11-14. Before publishing, swap `horizon.jpg` (a
   macOS wallpaper we may not redistribute) for a free photo and re-render that scene.
2. **Bouncy logo** (9:16, 7.5 s): the same prompt the user ran, re-made with an invented word (not Cuadrantec), in a
   fresh session. That run also counts as its cold verification.

## Phases

0. **Cut.** Delete everything in "What goes away". The site builds with an empty home and the layout.
1. **Content.** `gallery/`, the loader, `_director.md`, and the two entries (prompt text first; videos as they land).
2. **Home.** Grid, filters and search on UI SDK.
3. **Entry page.** Video, prompt with variables, copy, facts, collapsibles.
4. **Agents and docs.** `prompt.md` routes, `llms.txt`, README, AGENTS.md, CLAUDE.md.
5. **Videos.** The bouncy run in a fresh session; the liquid-glass scene re-render; web encodes, posters, sheets.
6. **Check.** Build, lint, `scripts/check-gallery.mjs`, and the site in the browser at desktop and phone width.

Each phase is shown to the user before the next. `check-gallery.mjs` grows with every phase.

## Acceptance

- [x] `git ls-files` has no `packages/`, `skills/`, `registry/`, `library/`, `examples/`; the site has no studio,
      boards, MCP, kit or library routes.
- [x] `npm run build` and `npm run lint` pass in `apps/web`.
- [x] The home shows both entries, filters work, `⌘K` finds an entry by title or technique.
- [x] On an entry page, typing in a variable field changes the prompt shown and the text copied.
- [x] `/v/<slug>/prompt.md` returns plain text with the director's pass; `/llms.txt` lists both entries.
- [x] Every entry shows its runs honestly, and every third-party asset is credited.
- [x] No asset in a published video is one we can't redistribute.
- [x] The site works at 375 px wide with no horizontal scroll.
- [x] `check-gallery.mjs` passes.

## Open decisions

| # | Decision | Recommended |
|---|---|---|
| D1 | Where the videos live | In the repo, web encodes ≤ 8 MB each. Move to Vercel Blob when the gallery passes ~30 entries. |
| D2 | The name | Keep **paper-motion** and its domain for now. |
| D3 | The bouncy entry | Re-make it with an invented word in a fresh session, with the prompt exactly as published. |
| D4 | The npm package | Deprecate `paper-motion` with a message pointing to the gallery, after this merges. It's your call and your account. |
| D5 | `horizon.jpg` | Replace it with a CC0 photo and re-render only the scenes that use it. |
| D6 | The look | Keep the approved brutalist system, applied to UI SDK's unstyled components. |
