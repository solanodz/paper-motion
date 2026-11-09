# Boards get short links and a return channel through a key-value store, without accounts

A board used to travel whole in the link's fragment (`/b#<deflate+base64url>`): nothing reached a server, but the links were long, capped at 8 KB, and the choice only came back when the user pasted a line into the chat. Stage 2 adds a server-side store and keeps everything else as it was.

- A board is stored under an unguessable 8-character id with a 90-day expiry; its link is `/b/<id>`. The fragment form keeps working forever and the CLI falls back to it when the site is unreachable (`--long` forces it).
- The user's choice is stored next to the board. `pamo board --url --wait` prints the link, waits (10 minutes by default) and prints the same reply line the user would have pasted; the page still shows that line, so pasting remains the fallback. The last choice wins while the board lives; a waiting CLI returns on the first.
- An MCP server at `/mcp` (remote, streamable HTTP, Vercel's `mcp-handler`) exposes `search`, `resource`, `board` (create, optionally wait) and `recolor`. It does not expose `add`: writing into the user's project stays with the agent's own tools.

The store is Upstash Redis through the Vercel Marketplace: a key-value store with native expiry, provisioned inside the Vercel project, free at this scale. The per-IP rate limit (60 boards an hour) and the 8 KB cap live there too. A database (Supabase was the candidate, already at hand) would have added a schema and a service account to hold two keys per board, so it waits for stage 3, when table-shaped things appear: accounts, board history per user, kits across devices, usage statistics. Stage 2 deliberately has no login, no history and no analytics, because the whole flow starts with "paste this prompt in your agent" and an account would break it.

Privacy: a stored board carries a brand's name, colors and the agent's notes. Ids are not enumerable, there is no listing or search, boards expire, and `pamo board --forget <id>` deletes one early.
