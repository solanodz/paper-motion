# The engine ships apart from the skills

The skills are plain editable files installed with `npx skills add` or as a Claude Code plugin, following Matt Pocock's model; the renderer is a separate npm package, `@paper-motion/engine`, with its own versions. Users are expected to edit their copy of a skill, which must not freeze the engine they render with, and engine fixes (WebGL limits, shader upgrades) must reach everyone without touching their edited skills. Bundling both in one package was simpler to install but would tie every engine update to a skill overwrite.
