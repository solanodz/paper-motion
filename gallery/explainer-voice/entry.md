---
title: Explainer with voice
summary: A warm three-step explainer with a voice-over, energy that flows between drawn objects, and a clear closing line.
format: "16:9"
duration: 36
techniques: [explainer, voice-over sync, particles, line drawing, dithered light]
bring:
  - A voice-over (vo.wav), or a text-to-speech service your agent can call. Without either, it writes the script and asks.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: product
    label: Product name
    default: Halo
  - key: what
    label: What it is, in one line
    default: a home battery that stores the sun your panels make, so your home runs on it at night
  - key: problem
    label: The problem it solves, in one or two sentences
    default: Your panels make the most power at midday, but your home needs it most at night.
  - key: steps
    label: The three steps (split by |)
    default: "Sunlight hits your panels | The rest flows into Halo | At night, your home runs on it"
  - key: flow
    label: What travels between the steps (energy, money, time, data…)
    default: the sun's energy
  - key: accent
    label: The one accent colour
    default: "sun orange #F0A040"
  - key: closing
    label: Closing line
    default: Keep the sun after dark.
runs:
  tried: 2
  passed: 2
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 36
  note: 'Run twice cold with very different values: Halo (a home battery, shown above) and Kitty (a shared money pot for flatmates, below). Each wrote and voiced its own script with ElevenLabs and took two director''s passes. Halo''s final render hung when the machine slept and was rendered again unchanged; Kitty took about 47 minutes.'
credits: []
also:
  - name: kitty
    title: Kitty, a shared money pot
    note: 'The same prompt with a product that has no object of its own. The agent drew the bills, the four flatmates, a cat-eared pot and a phone ledger, and kept mint for money only.'
    values:
      product: Kitty
      what: 'a shared money pot for flatmates: everyone chips in, the bills get paid on time, and nobody has to chase anyone'
      problem: Four flatmates, five bills, and one person always fronting the money. Then the awkward texts start.
      steps: Everyone chips in once a month | Kitty pays every bill on its day | Everyone sees where each peso went
      flow: money
      accent: 'mint green #2FB888'
      closing: Money, minus the awkward.
---

## Prompt

```text
Make a 36 s explainer, 1920×1080, 60 fps, rendered from code (an
HTML/canvas or WebGL page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg), with its
voice-over mixed in.

THE PRODUCT
"{{product}}": {{what}}. The problem: {{problem}} Three steps: {{steps}}
(split on "|"). What travels from step to step: {{flow}}. Closing
line: "{{closing}}"

VOICE-OVER (do this first)
- If there is a vo.wav, use it. If not, write a ~30 s script (about 75
  words): the problem in two short sentences, "{{product}}" and what it
  does, the three steps as "One: … Two: … Three: …", one line of benefit,
  then the name and the closing line. Generate it with whatever
  text-to-speech you can call (a calm, warm voice). Ask only if you have
  neither.
- Transcribe it with per-word timestamps; every beat below starts on the
  word that names it.

THE LOOK (warm and calm; check on your stills)
- A warm cream ground (#F7F2EA), soft grain. Every object is a thin line
  drawing (1.5 px, warm dark grey #3A3530), drawn by its strokes as it
  appears. Choose the objects from this product and its steps (the
  things, places and people the steps name), never generic icons.
- The only colour is {{accent}}, and it stands for {{flow}}: its source
  is a big soft orb made of fine dither dots that glows and breathes, and
  it moves as particles along curved paths between the objects, never
  straight lines.
- Big step numbers (1, 2, 3) in the accent, light weight, 22% of the frame
  height; the step text beside them in a clean sans, dark grey.
- One object shows what the product builds up (charge, savings, hours,
  progress…) as a soft accent fill and a number that counts.

STRUCTURE (timed to the voice)
1. The problem: a simple line diagram of the problem draws itself (a
   curve, a split, a pile, a gap; whatever shows it at a glance), and the
   part the product fixes glows in the accent.
2. The product: its name appears with one line; the glowing part gathers
   and turns into the product's own object.
3. Steps 1–3: each with its big number, its text, its objects drawing in,
   and particles carrying {{flow}} to the next object. The camera drifts
   from one step to the next, never cuts.
4. The benefit: a short line over a quiet wide shot that shows the benefit
   at scale (many of the people or places it helps, at rest).
5. The close (last ~4 s): the orb, "{{product}}" large in a heavy sans,
   "{{closing}}" under it. Hold to the end.

CHECKS (required)
- A contact sheet: the middle of every beat and 1 s before the end. Look
  at it.
- Does each beat start on its word? Are the objects this product's own,
  not stock icons? Do particles travel on curves between objects? Is the
  orb soft and dithered, not a flat circle? Is there a clear ending held
  on the name?
- Deliver the mp4 with the voice and the contact sheet.
```

## Failure modes

- **The voice and the picture drift.** Beats were timed by hand. Ask for every beat to start on its word from the transcript.
- **Clip-art objects.** Ask for thin line drawings that draw themselves, with the energy as the only colour.
- **Straight arrows.** Ask for particles on curved paths between objects.
- **Stock icons for an abstract product.** Software and services have no object of their own. Ask for the things and people the steps name, drawn as lines.

## Notes

What the agent had to decide for itself:
- The voice gives the three steps as "One / Two / Three", so each big number lands on that word and its text follows.
- The step 3 and benefit beats dim the cream ground towards dusk, so night reads without a second colour.
- The close strips everything back to the orb in a thin ring, so the name stands alone.

For Kitty, the agent decided for itself: the pot's number drains as bills are paid instead of only rising, amounts in pesos, and the fronted money (a glowing coin stack) is the part of the problem that glows.

Based on one of our own earlier pieces, an explainer for an invented home battery. Both products and all the copy are invented.
