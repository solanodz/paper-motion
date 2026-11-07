# Agent instructions

This repository is **paper-motion**: a pack of agent skills (in `skills/`) that
takes a user from "I have a brand" to a brand sheet and creative-directed videos, and
the engine that renders them (`packages/engine`, published as
`@paper-motion/engine`). The plan is `docs/spec-v1.md`; the shared language is
`GLOSSARY.md`; hard decisions are in `docs/adr/`.

When the user asks for a video, loop, motion piece, animated poster or any
"moving artwork": read `skills/make-video/SKILL.md` and follow it; for a brand (identity, look,
motion, sound, material), the skills in `skills/` each own one part. The engine
CLI is `node packages/engine/bin/pm.mjs`.

Works with any agent that can read files, run shell commands and look at images
(Claude Code, Codex, Cursor, Gemini CLI, OpenCode, …).

When changing the engine itself: `node packages/engine/bin/pm.mjs doctor`,
then render the examples in `packages/engine/examples` with `still` and look at
the contact sheets.
After upgrading `@paper-design/shaders*`, regenerate the catalog with `shaders --md`.
