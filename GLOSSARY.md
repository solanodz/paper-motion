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
The one local page where the user makes a piece, in four steps: What you want to say (the brief and the content they keep), How it looks (colours, type, background, movement, chosen by watching their own sentence), Your video (its scenes in a list, each edited in place: text, animation, background, speed, the transition into the next) and Export. It is the only address the user opens while a piece is open: the agent's choices come into it, not as links ([ADR 0005](docs/adr/0005-the-studio-replaces-board-links-during-a-piece.md)). It says only what it can check about the agent: asking, listening, working, or not connected.
_Avoid_: dashboard, editor, review app

**Step**:
One of the studio's four screens, in order: What you want to say, How it looks, Your video, Export. Underneath, steps track the piece's stages (brief and inventory, look, video, final).
_Avoid_: stage (the agent's word, in piece.json), page, tab

**Scene**:
A part of the video as the studio names it to the user: one block or shot, playing whole, faster or slower as its length says. `chain.json` still calls it a part.
_Avoid_: clip, slide, shot (a shot is one kind of resource)

**Choice**:
Options the agent puts into the studio for the user to decide (`pamo board` while a piece is open). They appear on the step they belong to, marked as suggested by the agent; picking one sends the agent the same reply line a board does.
_Avoid_: suggestion card, proposal

**Listening**:
The agent waiting on the piece between its turns (`pamo piece listen`, running in the background), so what the user does in the studio reaches it without going to the chat. The studio shows it only while it is true.
_Avoid_: connected (say what it is doing), online

**Inventory**:
The list of what a piece can really show, written before its structure: figures, screenshots, commands, lines, each with its kind and where it came from. The agent gathers it from what the user already has (their site, a README, the brand's Facts, their files) as proposals; the user keeps what is true and removes the rest in the studio, and only what they kept goes into a piece. Blocks and shots declare the kinds they show, so a structure is proposed from the inventory and each part arrives with that content in place.
The studio shows it to the user as **Content**, in everyday words (a sentence, a number, a screenshot), never with the names of kinds, fields or blocks.
_Avoid_: content plan, assets list, material (which is the shader set's word), facts (which are the identity's true claims; an inventory item cites them)

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
