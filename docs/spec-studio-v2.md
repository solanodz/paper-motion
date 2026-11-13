# Studio v2 · spec: one screen, guided steps

Status: **approved** (2026-11-13), with the recommended answer to D1–D4. Nothing here is built yet. Next: a clickable mini demo
made from this spec ([works/studio-v2-demo](../works/studio-v2-demo/)), then the plan ([plan-studio-v2.md](./plan-studio-v2.md)), then the build. Terms are in [GLOSSARY.md](../GLOSSARY.md).

## Why

What the user found while making a real piece (`site`) with the 0.4 studio:

1. **Two places to decide.** Visual choices (palette, type, backgrounds, moves) arrive as board links on the site,
   one link per decision, while the piece is edited in the local studio. The user goes in and out of links.
2. **The studio says the agent is waiting when it is not.** The studio guesses the agent's state from flags the agent
   sets and must clear: a question (`piece ask`) stays on screen until the agent runs another command, and never
   expires. The agent only hears the studio while a `piece review` command is blocking, so a message sent from
   "Ask your agent" can sit unread with nothing on screen saying so.
3. **It still looks like a timeline.** "Your video" shows the parts as a horizontal strip with arrows between them.

## Destination

Studio v2 is done when a person who has never edited video makes and exports a fully customized piece **without
leaving one page**, without opening a link the agent sent, without a timeline, and without being told the agent is
waiting when it is not.

## Who it is for

The same people as [spec v1](./spec-v1.md): founders, developers and small studios who use a coding agent and don't
know After Effects; designers who already know their brand. Everything on screen reads to a non-programmer.

## Principles

1. **One address.** The project's studio (`http://127.0.0.1:<port>/`) is the only page the user opens. The agent
   never sends another link while a piece is open.
2. **Steps, not screens.** The page is one guided sequence. It shows the step the user is on and adapts as they move
   forward; any earlier step can be reopened.
3. **Decide by watching.** Every visual choice (a palette, a font pair, a background, an animation, a transition)
   is made by watching it play with the user's own words and name, never a generic sample.
4. **Simple surface, full control.** No timeline, no keyframes, no jargon. Everything is still changeable: words,
   animations, backgrounds, colours, type, speed, transitions, order, scenes added or removed.
5. **The studio only states what it can check.** Every message about the agent comes from a fact the studio can
   verify right now, or it is not shown.
6. **Light on the machine.** One scene plays live at a time; everything else is a still or a short clip.

## The steps

A stepper across the top, always visible: **1 What you want to say · 2 How it looks · 3 Your video · 4 Export.**
Each step shows a check when done. The current step fills the page.

### 1 · What you want to say

As today's "What it says": the brief (five fields) and the content (keep, not this, must, edit, add).

- Done when the brief is right and nothing waits for a decision. The button is **Next: how it looks**.

### 2 · How it looks

Replaces the palette, type, background and moves boards.

- Four choices, one after another on the same page: **Colours**, **Type**, **Background**, **Movement** (pace and
  how things enter).
- Each shows 3 to 6 options as cards. The card under the pointer, or the selected one, plays live with the user's
  first sentence and name; the others show a still.
- Options come from the library, matched to the brand's facts. When the agent proposes options (see "Choices from
  the agent"), they appear first, marked **Suggested by your agent**, with its one-line reason.
- A colour can be fine-tuned (background, text, accent) and a palette can be taken from their logo or site.
- Choosing writes `brand/` exactly as `pamo add` does today (tokens, fonts, shader set, motion).
- If the project already has a brand, the step opens done, showing its current look, and can be changed.
- Done when all four have a choice. The button is **Next: make my video**, which builds the first version.

### 3 · Your video

**Scenes, not a timeline.**

- **Left:** the scenes in a vertical list, like slides. Each has its number, a still, what it says in one line, and
  its length.
- **Centre:** the selected scene playing live, once, holding its last frame; a click plays it again.
- **Right:** what can be changed in that scene, in tabs:
  - **Text:** the words and numbers it shows.
  - **Animation:** how it arrives, picked by watching each option.
  - **Background:** the brand's set, or one more from the library.
  - **Speed:** the length slider. A scene always plays whole, so length is speed: from 1.6× faster to 0.6× slower
    than its own length, with a plain line such as "Plays 20% slower" (as in 0.4.1).
  - **Into the next scene:** the transition, picked by watching each.
- Scenes are reordered by dragging in the list. **Add a scene** asks what it is for (say something, show the
  product, prove it, how it works, end) and offers scenes that can show something already kept. Each scene can be
  shown another way, duplicated or removed.
- **Play the whole video** plays the scenes in order, each once, then stops.
- **Undo** for every change, as today.
- The whole video's look is changed by going back to step 2; the scenes update in place.

### 4 · Export

As today: render at full quality with motion blur and sound, watch it, download the files. A render that is out of
date says so.

## Choices from the agent

Today `pamo board` makes a link on the site. With a piece open and its studio running:

- `pamo board … --piece <piece>`, or the open piece found by itself, puts the options **into the studio**, on the
  step they belong to (a palette goes to Colours, a structure to Your video). It prints no link.
- The command waits for the choice the same way, and prints the same reply line, so agents and skills need no other
  change.
- The user sees a dot on that step in the stepper and **Your agent suggests…** on the step itself.
- Without a studio (no piece open, or the user asked for a link to share) boards work as today.

## Agent and studio

### What the studio shows about the agent

Only these states, each from a fact:

| State | When | Shown as |
|---|---|---|
| Listening | a command of the agent is waiting on this piece, beat less than 9 s old | "Your agent is listening. What you do here reaches it." |
| Working | the agent said what it is doing (`piece working --on "…"`) less than 20 minutes ago, and is not listening | "Your agent is working on…" and for how long |
| Asked you | the agent asked a question that is still open | the question, with an answer box |
| Not connected | none of the above | "Your agent isn't connected. What you send is kept and it reads it when it's back." |

"Your agent is waiting for you" is never shown unless the agent is listening. (Working is declared rather than beaten: an agent editing files runs no command, and a beat would show it as not connected while it works. It lapses after 20 minutes of silence.)

### Listening without the chat

- New: `pamo piece listen <piece>`. It waits until the user does something that needs the agent (sends a message,
  answers a question, approves a step, picks an option the agent offered). Then it prints that as lines, the same
  as `piece review`, and exits. After 9 minutes with nothing, it exits and says so, staying under agents' command
  time caps.
- The make-video skill tells the agent to keep `piece listen` running in the background between turns, so the user
  never needs to go to the chat to say "continue". Claude Code wakes when a background command exits; for an agent
  that cannot, the studio honestly shows "Not connected".

### Messages and questions

- **Ask your agent** becomes a short thread on the page: each message the user sent shows **Sent**, then **Read**
  with the time once the agent has read it (any of `piece listen`, `review` or `status`).
- `piece ask` shows the agent's question in the studio with an answer box. Answering there closes it and wakes the
  agent. If the user answered in the chat instead, **Answered in the chat** closes it. A question also closes when
  the agent runs `piece ask --done`, `review` or `working`.

## Performance

- At most one live scene on the page at a time (the selected scene, or the card under the pointer).
- Everything else is a still or a clip from the registry's previews.
- Live scenes draw at the size shown, skip hidden layers and play at 30 fps (as in 0.4.1).
- With the studio idle, CPU stays under 10% on an M-series Mac.

## Out of scope

- Accounts, cloud projects, sharing a studio with someone else.
- A phone layout: the studio is a desktop page.
- Keyframes, a timeline, per-frame edits.
- Uploading music. The user's own track still goes through the agent.
- Removing web boards: they remain for when no piece is open.

## Decisions to make before the demo

| | Decision | Recommended | Alternative |
|---|---|---|---|
| D1 | How "Your video" lays out scenes | **A list of scenes, like slides** (overview, drag to reorder) | One scene at a time, "Scene 2 of 6" with previous and next (simpler, no overview) |
| D2 | Connection with the agent | **The agent listens in the background** (`piece listen`), with honest states | No live link: the studio never shows the agent's state; the user says "continue" in the chat |
| D3 | Where "How it looks" goes | **Second, after the content**, so options play with the user's own sentence | First, before the content (the look exists before there is anything to say) |
| D4 | The word on screen | **Scene** (in Spanish, *escena*) | Part (the word in `chain.json`, unchanged underneath either way) |

## Acceptance

A fresh project, a new piece, the user in the studio and the agent in Claude Code:

1. The agent runs `piece init`; the user opens one address and never opens another until the file is exported.
2. In step 1 the user keeps four things and corrects one sentence. **Next** goes to step 2.
3. The agent offers three palettes with `pamo board`; they show in Colours as suggested, with no link printed.
   Picking one prints the reply line in the agent's command.
4. The user picks a font pair, a background and a pace by watching each with their sentence. `brand/` holds them.
5. Step 3 shows scenes in a list with no strip or arrows. The user changes a scene's words, its animation, its
   background, makes it 20% slower, changes the transition after it, moves it up one place and adds a scene that
   proves something kept. Undo reverts the last of these.
6. With the agent not listening, the studio says "Not connected". The user sends "make the ending warmer": it shows
   **Sent**. The agent starts `piece listen`; the studio says "Listening" within 9 s and the message turns **Read**
   once the command prints it.
7. The agent asks a question with `piece ask`; the user answers it in the studio; the agent's listen command prints
   the answer and the question is gone from the page.
8. At no point does the studio say the agent is waiting while no command of the agent is running.
9. Step 4 renders the final; the file plays the scenes exactly as the list shows them.
10. Through all of it, CPU with the studio open and idle stays under 10%.

## What changes, by area

For the plan after approval:

- **Studio page** (`studio/index.html`): the stepper, step 2 (new), step 3 laid out as a list of scenes, the
  message thread, the answer box, the agent states.
- **Studio server** (`lib/studio.mjs`): look options with live previews of the user's sentence, choices from the
  agent, read receipts, answers.
- **Piece** (`lib/piece.mjs`): `piece listen`, read times on events, answers to questions, choices stored on the
  piece.
- **Boards** (`bin/pamo.mjs`, `lib/board.mjs`): route to the studio when a piece is open (`--piece` already picks
  the piece; today it only lists the board's link in the studio).
- **Skill** (`skills/make-video/SKILL.md`, the agent guide in `registry.mjs`): run `piece listen` in the background;
  no board links during a piece.
- **Site**: the docs page and the making-of describe the four steps.
- **ADR 0005**: the studio replaces board links while a piece is open.
