# paper-motion

**Videos your agent can make, each with the exact prompt that made it.**

paper-motion is a gallery. Every video in it was made by a coding agent (Claude Code, Codex, Cursor…) from a single
prompt, rendered from code. Each one comes with:

- the prompt, ready to copy, with fields that adapt it to your brand;
- what you need to bring (a voice-over, a logo, ffmpeg…);
- how honest the result is: the model, the agent, the date, and how many cold runs passed;
- what goes wrong, and what to say to your agent when it does.

Browse it at **[paper-motion.vercel.app](https://paper-motion.vercel.app)**. Agents can read
[`/llms.txt`](https://paper-motion.vercel.app/llms.txt) and fetch any prompt as plain text at `/v/<slug>/prompt.md`.

## How to use a video

1. Pick one in the gallery.
2. Fill in its fields (your word, your colours, your topic). The prompt changes as you type.
3. Copy it and paste it into your agent, in the folder where the video should go.

Every prompt ends with the same **director's pass**: contact sheets, a blind critic in a fresh subagent with at most
six timestamped notes, and one revision. It is the one thing that reliably made agent videos better in our tests.

## Why a gallery and not a tool

paper-motion used to be a pack of skills, a render engine and a studio. On 2026-11-13 we tested it blind against
Claude Code alone, on made-up brands. The full tool and its library both lost to the agent alone, and a leaner
version didn't beat it by enough to be worth installing. What did improve the videos was a blind critic loop.
The full results are in [docs/bake-off-results.md](docs/bake-off-results.md), and the reasoning behind the gallery in
[docs/spec-gallery.md](docs/spec-gallery.md).

So the value isn't in a tool. It's in knowing what to ask for: the timing, the material, the camera and the checks.
That is what each entry is. The old engine and skills are kept in git history (tag `v0.5`, branches `archive` and
`lean`).

## Contributing a video

Read [AGENTS.md](AGENTS.md). In short: an entry is a folder in `gallery/` with the prompt, the video and its facts,
and it is published only after the prompt has been run cold, in a fresh session, and passed.

## License

MIT. Third-party assets inside a video are credited on its page, under their own licences.
