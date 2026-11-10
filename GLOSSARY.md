# paper-motion

A pack of agent skills that takes someone with no motion experience from "I have a brand" to "I have my brand sheet and my first video", and lets designers who already know what they want skip straight to the parts they need.

## Language

### The brand

**Brand**:
The company, product or person a user makes videos for. One project serves one brand.
_Avoid_: client, company, account

**Identity**:
Who the brand is: its purpose, personality, voice and references. Decided before anything visual.
_Avoid_: branding, brand strategy

**Visual system**:
How the brand looks: typefaces, colors, shapes and their rules, decided together because each changes how the others read.
_Avoid_: style guide, design system, look and feel

**Motion style**:
How the brand moves: pace, camera, transitions and effects.
_Avoid_: animation style, video style

**Sound kit**:
How the brand sounds: the palette of sound effects, music stance and loudness.
_Avoid_: audio branding, SFX pack

**Wordmark**:
The brand's name set in its chosen typeface, used as its logo. The pack never draws pictorial logos; it builds a wordmark or uses the logo the user brings.
_Avoid_: logo (when the wordmark is meant)

**Brand folder**:
The single place in a user's project where every decision about the brand is written down. Every skill reads it before acting and writes back what was decided.
_Avoid_: config, settings, brand kit

**Brand sheet**:
The page that shows the whole brand at a glance: identity, visual system, motion style, sound kit and wordmark.
_Avoid_: brand guidelines, style tile, identity page

### Making videos

**Piece**:
One video made for the brand, in one format the user picks (16:9, 9:16 or 1:1), from brief to final render. Another format is another piece, made on its own.
_Avoid_: project, clip, asset

**Move**:
A named, reusable piece of motion the engine knows how to perform (a wipe, a push, a masked reveal, a dive into a frame, terminal typing), each with a demo clip. A brand's motion style picks its moves.
_Avoid_: transition (for the whole family), preset, effect (alone)

**Recipe**:
A proven structure and timing for a kind of piece (launch, explainer, social loop, end card). It never carries a look; the look always comes from the brand folder.
_Avoid_: template, format

**Shader set**:
A brand's own bank of moving material in one shared format, used in pieces. It can come from the user's own loops and images, be made by the agent, or be tuned by hand in Paper (the recommended way); Paper is never required.
_Avoid_: library (when the brand's set is meant), backgrounds

**Resource**:
Anything in the registry an agent can install by name: a move, a background, a palette, a font pair or a recipe. Installed as code or brand files the user owns.
_Avoid_: asset, component (for the whole family), template

**Registry**:
The catalog of resources, kept in `registry/` and published at paper-motion.app as `llms.txt`, `registry.json` and one JSON file per resource.
_Avoid_: marketplace, store, library (when the registry is meant)

**Playground**:
A resource's page on paper-motion.app where its preview plays live and its params can be tuned, with the code for the current settings beside it.
_Avoid_: editor, sandbox, configurator

**Engine**:
The renderer that turns a scene into frames and a video file. It is shipped and versioned apart from the skills.
_Avoid_: runtime, renderer (in prose)

### How the skills work

**paper-motion**:
The name of the pack, and of its entry skill: the one a user calls first, which sends them to the skill that fits where they are.
_Avoid_: using it for the engine or for making a video

**Guided start**:
A skill's entrance for someone starting from nothing: it runs an interview.

**Import start**:
A skill's entrance for someone who already decided: it takes what they bring (fonts, colors, a brand manual, a website, a Figma or Paper file), writes it to the brand folder and asks only for what is missing.
_Avoid_: expert mode, skip

**Studio**:
The local page where the user follows one piece through its stages (brief, look, structure, parts, assembly, final), approves each or asks for changes, and edits by hand what needs no judgment. The agent hands each stage over and reads back what the user did.
_Avoid_: dashboard, editor, review app

**Chain**:
One piece made of several blocks or shots played in order, each in the brand's look, each joined to the next by a cut, whip, dissolve or dip. What a chosen structure becomes when its beats name the blocks that show them.
_Avoid_: sequence (the board's word for several picks), montage, playlist

**Board**:
A set of labelled options (A, B, C, D) the agent shows the user to decide one thing: a palette, a background, a move, a recipe, or whole kits. It has two forms: a rendered board (a still or short clips, shown in the chat) and a live board (a paper-motion.app link where the options play in the user's look and can be tuned before choosing).
_Avoid_: option board (the old name), mockup, moodboard, variants page

**Kit**:
The user's chosen resources with their settings: a look (palette, font pair), material (backgrounds), motion (moves) and a structure (recipe). Boards fill it; it becomes one prompt for the agent.
_Avoid_: cart, selection, project

**Interview**:
The pack's way of finding out what the user wants: rounds of numbered questions, each with a recommended answer and, where the choice is visual, a board.
_Avoid_: questionnaire, form, intake (outside a piece)
