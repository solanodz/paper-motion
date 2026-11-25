# paper-motion.vercel.app

The gallery site. Next.js 16 on UI SDK, deployed on Vercel from `main` (project `paper-motion`, root directory
`apps/web`).

```bash
npm install
npm run dev        # drafts show here
npm run check      # validates every entry in ../../gallery and the routes built from them
npm run build
```

`predev` and `prebuild` run `npm run sync`, which copies each entry's media from `../../gallery/<slug>/` into
`public/gallery/<slug>/` (git-ignored). The entries themselves are read at build time by `src/lib/gallery.ts`.

Routes:
- `/`: the gallery, with filters and ⌘K search.
- `/v/<slug>`: one video, its prompt with fields for its variables, what to bring, failure modes, credits.
- `/v/<slug>/prompt.md`: the prompt as plain text, defaults filled in, director's pass appended.
- `/llms.txt`: what the site is, and every published prompt.

`PAPER_MOTION_SITE` sets the public URL used in metadata and `llms.txt` (default `https://paper-motion.vercel.app`).
`PAPER_MOTION_DRAFTS=1` shows drafts in a production build.
