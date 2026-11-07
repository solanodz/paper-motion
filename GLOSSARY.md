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

**Option board**:
A rendered set of labelled choices (A, B, C, D) shown during an interview: stills for questions of form, short clips for questions of motion.
_Avoid_: mockup, moodboard

**Interview**:
The pack's way of finding out what the user wants: rounds of numbered questions, each with a recommended answer and, where the choice is visual, options the user can see.
_Avoid_: questionnaire, form, intake (outside a piece)
