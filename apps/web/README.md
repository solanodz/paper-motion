# paper-motion.app

The site: a library of named motion resources for agents and the live boards they send their users. Next.js 16, deployed on Vercel from `main` (project `paper-motion`, root directory `apps/web`).

## Develop

```bash
npm install
npm run dev
```

`predev` and `prebuild` run `npm run registry`, which builds `public/registry.json`, `public/r/<id>.json`, `public/llms.txt` and `public/llms-full.txt` from `../../registry` with the engine, and copies the two engine modules the site shares (`customize.mjs`, `live-board.js`).

`PAPER_MOTION_SITE` sets the public URL written into those files and the OG metadata. It defaults to `https://paper-motion.vercel.app`.

## Previews

```bash
node ../../packages/engine/bin/pamo.mjs registry previews [--only <id>]
```

renders a clip and a poster per move and recipe into `public/previews/`. Backgrounds play live and have no files.

## Smoke test

```bash
npm run smoke                       # production
npm run smoke -- http://localhost:3000
```

fetches every page, every agent-facing file and every published preview the index lists, and fails if any answer is not 200. Run it after a deploy.
