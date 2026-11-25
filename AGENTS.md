# Agent instructions

This repository is **paper-motion**: a gallery of videos made by coding agents, each with the exact prompt that made
it. The content is in `gallery/`; the site that shows it is `apps/web`. Why it is shaped this way:
`docs/spec-gallery.md` and `docs/bake-off-results.md`.

There is no engine, CLI or package any more. Don't add one: the blind tests showed a good agent with a good prompt
beats any tool we put around it.

## An entry

```
gallery/<slug>/
  entry.md        frontmatter (title, summary, format, duration, techniques, bring, variables, runs, credits)
                  + "## Prompt" (one fenced block, {{key}} slots), "## Failure modes", "## Notes"
  video.mp4       web encode, ≤ 8 MB: H.264, yuv420p, faststart (ffmpeg -crf 27 -preset slow -movflags +faststart)
  poster.jpg      a good early frame, 1280 wide
  contact.jpg     the contact sheet the run was judged on, 1200 wide
```

`gallery/_director.md` is the director's pass. The site appends it to every prompt; don't repeat it in an entry.

## Adding one

1. Write the prompt. It must carry everything: timings, material, camera, checks. Every `{{key}}` is a declared
   variable and every variable is used (the loader refuses otherwise).
2. **Run it cold**: a fresh session, the prompt as written plus the director's pass, nothing else. Record what really
   happened in `runs` (tried, passed, model, agent, date, minutes) and any question the agent had to ask in
   `runs.note`. If it needed help, fix the prompt and run it again.
3. Publish only what passed. Until then keep `draft: true`: drafts show in `next dev` only.
4. Credit every third-party asset in `credits`, with its licence. Nothing we can't redistribute (no system
   wallpapers, no other people's brands or screens). Entries teach a technique; they don't copy someone's video.
5. Check: `cd apps/web && npm run check && npm run build`.

## The site

Next.js 16 (read `apps/web/AGENTS.md` first) on **UI SDK**: before using it, read
`apps/web/node_modules/@ui-sdk/react/docs/llms.txt`, and the component's page next to it. Its parts are unstyled;
the house look (black, no radius, 1px rules, paper for the current thing, actions invert, Geist Serif/Sans/Mono/Pixel)
lives in `apps/web/src/app/globals.css`, keyed on the parts' `data-slot` and state attributes.
