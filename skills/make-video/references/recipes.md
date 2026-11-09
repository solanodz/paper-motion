# Recipes

A recipe is a proven structure and timing for a kind of piece. It never carries a look: the look, moves, sound and
material always come from the brand. Times below are for the brand's pace (`motion.json`): stretch them ×1.4 for a
calm brand, compress ×0.75 for a fast one; when the user asks for a length, theirs wins and the beats scale to fit.
Every recipe works in 16:9, 9:16 and 1:1; the notes say what changes.

Beats name a gesture and the brand cue it carries (`B.cue(s, 'transition' | 'land' | 'text', t)`).

Every recipe carries the **what** (what the brand is, in plain words) in its first third and **one action** at the
end; the tables mark where.

## Launch (20–30 s)

Something new exists; show it and make people want it.

| Beat | Time | What happens |
|---|---|---|
| Hook | 0–2 s | One striking image or line, already moving: the brand's strongest material from the shader set behind the boldest claim. No logo yet. |
| Problem | 2–6 s | The situation the product changes, in the brand's words (IDENTITY.md's Audience). |
| Reveal | 6–9 s | The product appears with the **what**: its name and what it is in plain words ("Kiln, a build cache for monorepos"); a transition from the repertoire, the `land` cue. |
| Proof | 9–20 s | Three moments that show it working with real material (the real UI, a real command and its output), each its own mechanic, never one treatment three times. Claims only from IDENTITY.md's Facts. |
| Close | 20–26 s | The ending from `motion.json` (often the wordmark) with the **action**: where to get it, when it is out. |

9:16: one idea per screen, body type large enough for a phone (≈ 48–64 px unless the brand's rules want it small), keep the bottom 20 % clear of UI.

For brands without a product to demo (a musician, a place, a person), "proof" is the work itself: the music under the picture, the cover art, the place, the date. Fewer beats, held longer, suit calm brands: a 15 s launch at a calm pace is three beats, not five.

## Explainer (30–45 s)

How something works, in steps.

| Beat | Time | What happens |
|---|---|---|
| Question | 0–3 s | What this answers, in one line, naming what the brand is. |
| Steps | 3–33 s | Three or four steps, each 6–9 s: a label (01, 02…), the step shown with real material (the real interface, the real product), a transition between steps. One continuous camera (`travel`) reads best when the brand allows it. |
| Recap | 33–40 s | All steps at once, small, so the whole process is seen. |
| Close | 40–45 s | The ending and the **action**. |

16:9 suits it best; on 9:16 give each step its own screen.

## Product demo (18–24 s)

The real product, seen. `pamo add product-demo` writes a scene that needs only the screenshots.

| Beat | Time | What happens |
|---|---|---|
| What | 0–3 s | The name and what it is, in plain words, over the brand's field. |
| Shots | 3–19 s | Three screens of the real UI inside one window. One camera lives on them: it drifts, punches into the detail that matters (`focus`), snap-scrolls to the next screen, whips to the third. A caption under the window says what each screen proves. |
| Close | 19–22 s | The wordmark and the **action**. |

Without screenshots each shot draws a placeholder UI in the brand's colors, so the structure can be judged before the material exists; never ship the placeholders. 9:16: the window fills the width and the captions go above it.

## Release (12–18 s, square or portrait)

A record, a single, an episode. `pamo add release`; render with the track (`--audio`).

| Beat | Time | What happens |
|---|---|---|
| Cover | 0–1.5 s | The cover art rises through a mask, the `land` cue; its colors glow behind everything. |
| Words | 1.5–6 s | The title (display), who (title), what it is in plain words ("the debut EP", "episode 12"). |
| Pulse | whole piece | The cover breathes and a row of bars moves on the track's BPM (`CONFIG.bpm`), not on the audio. |
| Action | 9–15 s | The date and where to listen, then the wordmark small; everything holds so the frame can be read. |

1:1 and 4:5 for feeds, 9:16 for stories (the sleeve on top, the words under it). Without a cover the brand's shader fills the sleeve.

## Social loop (6–10 s, seamless)

A piece that plays forever in a feed.

| Beat | Time | What happens |
|---|---|---|
| Field | whole loop | A shader-set entry with `loop` crossfade (diffuse fields) or a periodic `motion`. |
| What | whole loop | The name and what it is, small and steady ("Corteza · sourdough bakery · Madrid"), so a loop seen once still says what it is. |
| Line | 1–5 s | One line of the brand's voice enters with its text behavior, holds, leaves before the end. |
| Seam | last 0.5 s | Everything returns to the first frame's state; check frames 0 and last with `pamo still`. |

1:1 and 9:16 first. The action goes in the post's caption, so the loop stays clean.

## End card (5–8 s)

The last seconds of any piece, or a sting on its own.

| Beat | Time | What happens |
|---|---|---|
| Reveal | 0–2 s | The wordmark arrives with the repertoire's move (a wipe, a mask, a logo shader like LiquidMetal), the `land` cue. |
| Line | 2–3 s | What the brand is, in plain words (its one line), small. |
| Action | 3–5 s | The **action**: a URL, a handle, a date, an install command typed with the brand's typing. |
| Hold | to the end | Everything still, a cursor blinking if there is one, so the frame can be read. |

## README loop (6 s, seamless, 1600×900 or 16:9)

For a repository or a landing page hero; silent.

| Beat | Time | What happens |
|---|---|---|
| Field | whole loop | A calm shader-set entry behind the wordmark. |
| What | whole loop | The wordmark and what it is, in one plain line. |
| Command | 0.4–2 s | The install command types in (the action); holds. |
| Erase | 5–5.5 s | It erases, so the loop closes on an empty prompt. |

Deliver an mp4 and a gif (`--format gif --gif-width 800`).
