import type { Metadata } from "next";
import { CopyButton, CopyLine } from "@/components/copy-button";
import { IconAgent } from "@/components/icons";
import { starterPrompt as prompt } from "@/lib/prompt";
import { getIndex } from "@/lib/registry";

export const metadata: Metadata = { title: "For agents" };

// the same prompt the home page hands to the user

// the four stages of a piece, the same ones the studio shows (the user sees three steps: What it says, Your video,
// Export): what the agent prepares before handing each one over
const STAGES: { t: string; id: string; d: string; cmds: string[] }[] = [
  { t: "Brief", id: "brief", d: "Interview the user, then fill the five fields: what, who, format, tone and action.", cmds: ["piece init"] },
  { t: "Content", id: "inventory", d: "Gather what the video can really show from their site, files and brand. They keep, remove or correct each thing.", cmds: ["inventory --from"] },
  { t: "Video", id: "video", d: "The studio builds the first cut from what they kept. They edit it themselves; you do what they ask for.", cmds: ["piece review video"] },
  { t: "Final", id: "final", d: "The full render, from the studio or by you.", cmds: ["chain --motion-blur 5"] },
];

// one piece from start to finish, in the order the commands are really run: paper-motion's own film, the one on the
// home page. `say` is a step with no command (the agent talks, writes or waits).
type Step = { cmd: string } | { say: string };
const RUN: { stage: string; id: string; steps: Step[] }[] = [
  { stage: "Set up", id: "setup", steps: [
    { cmd: "npx skills add solanodz/paper-motion" },
    { cmd: "npx paper-motion setup" },
  ] },
  { stage: "Brief", id: "brief", steps: [
    { cmd: `npx paper-motion piece init paper-motion --title "paper-motion"` },
    { say: "Interview the user: what the film says, to whom, format, tone, the action at the end." },
    { cmd: `npx paper-motion piece init paper-motion --what "Art-directed video from a conversation" --who "people who build with coding agents" --format "16:9, 30 s" --tone "quiet, exact" --action "paper-motion.app"` },
    { cmd: "npx paper-motion piece review paper-motion brief" },
  ] },
  { stage: "Content", id: "inventory", steps: [
    { cmd: "npx paper-motion inventory paper-motion --from https://paper-motion.vercel.app --from README.md --from brand" },
    { say: "It reads the site (and screenshots it on a desktop and a phone), the README and the brand, and writes what it finds as proposals. Read every one before the user does: drop the noise, aim for six to eight things worth showing, and fill what the report says is missing." },
    { cmd: "npx paper-motion inventory paper-motion --remove <id>,<id>" },
    { say: "A command found in a README has no output until it runs. Run it and pipe what it really printed; never invent one." },
    { cmd: "<the command> 2>&1 | npx paper-motion inventory paper-motion --output <id>" },
    { cmd: "npx paper-motion piece review paper-motion inventory" },
    { say: "In the studio the user keeps, removes or corrects each thing, stars what must appear and adds their own. When they press Make my video, the studio builds the first cut itself: the planner's structure, every part filled with their content." },
  ] },
  { stage: "Video", id: "video", steps: [
    { cmd: "npx paper-motion piece review paper-motion video" },
    { say: "The user edits it live: words and numbers, how a sentence arrives, backgrounds, settings, lengths, transitions, order, and the whole video's colours, type and pace. Each edit prints as one line; build on them, never undo them. Do only what they ask for in Ask your agent (a changes line), then review again." },
  ] },
  { stage: "Final", id: "final", steps: [
    { say: "The user renders it from the studio's Export step. Or render it yourself:" },
    { cmd: "npx paper-motion chain paper-motion --motion-blur 5" },
    { cmd: "npx paper-motion piece review paper-motion final" },
    { cmd: "npx paper-motion studio --stop" },
  ] },
];

const WHO: [string, React.ReactNode][] = [
  ["The user", "Sees each stage in the studio, a local page, and edits the video there themselves: words, backgrounds, transitions, lengths, order, colours and type. Approves each stage or asks for changes."],
  ["The agent", <>Hands over a stage with <code className="font-mono text-[13px] text-figure">piece review</code> and waits. The decision arrives on its own, as lines the command prints: an approval, a change to make, or an edit the user already made. Build on those edits, never undo them.</>],
  ["Boards", "For the brand's look before a piece (palette, type, backgrounds, moves): links the user opens to compare options and choose. Inside a piece the user changes the look in the studio."],
  ["Without a browser", "Only when the user can't open one, run the same stages in the chat."],
];

const BOARD_CMD = `npx paper-motion board --url --title "Backgrounds for Kiln" --look cobalt,geist --option mesh-graphite --note "quiet, graphite" --option neuro-slate --note "a technical web" --option "dither-slate:colorFront=#3d6bff" --note "pixels in your accent" --option grain-slate`;

type Group = { id: string; title: string; stages: string; note: string; rows: [string, string][]; prints?: [string, string][] };
const COMMANDS: Group[] = [
  {
    id: "setup", title: "Set up", stages: "before the brief", note: "The skills and the engine. Every command answers --help.",
    rows: [
      ["npx skills add solanodz/paper-motion", "The skills. Read make-video right after installing and follow it in this session."],
      ["npx paper-motion setup", "The engine: Node 18+, ffmpeg and Chrome."],
    ],
  },
  {
    id: "studio", title: "The studio", stages: "every stage", note: "Where the user decides. Start the piece right after setup.",
    rows: [
      [`npx paper-motion piece init <piece> --title "…"`, "Starts a piece, and the project's studio in the background."],
      [`npx paper-motion piece init <piece> --what "…" --who "…" --format "…" --tone "…" --action "…"`, "Writes the brief, after the interview."],
      ["npx paper-motion piece review <piece> <stage>", "Hands a stage to the user. The first time it opens the studio in their browser. It waits for their decision and prints what they did, one line each. It refuses while an earlier stage is not approved; --skip moves on without it, only when the user agreed."],
      ["npx paper-motion piece working <piece> <stage>", "Marks a stage as yours: when you start it, or after the user asked for a change. The studio shows you are on it. Fix it, re-render, then review again."],
      ["npx paper-motion piece ask <piece> \"<question>\"", "Run it right before you ask the user anything in the chat. The studio shows the question across the top with a button back to you, so they are never left waiting in the wrong place. The next review or working clears it."],
      ["npx paper-motion piece status <piece>", "Shows where everything stands and what you haven't read."],
      ["npx paper-motion studio --stop", "Ends the background studio when the piece is done."],
    ],
  },
  {
    id: "boards", title: "Boards", stages: "the brand", note: "One link per visual decision, with two to four options from the registry.",
    rows: [
      [`npx paper-motion search --type background --mode dark --near "#0a0f1f,#eef1f8,#3d6bff"`, "Filters the registry by its metadata. With --near it sorts by color fit to the brand's ground, text and accent."],
      [BOARD_CMD, "Prints the board's link, keeps running, and prints the choice the moment the user makes it (it waits 10 minutes by default). The options play live in the look you pass."],
      ["npx paper-motion board --await <id> --wait 2", "When your shell caps how long a command may run: share the board with --no-wait, then ask with this until it prints the line. Exit code 3 means not yet."],
    ],
    prints: [
      ["paper-motion: B · mesh-sage --set speed=0.8 (bg-1)", "What it prints when the user chooses: one line, carrying every value that differs from the defaults as --set arguments."],
      ["paper-motion: A+C · type-on · scramble (text-1)", "When the board let them pick several, with --choose 1-3."],
      ["paper-motion: none of bg-1, calmer ones", "None of these, and what they would rather see."],
    ],
  },
  {
    id: "install", title: "Install", stages: "the brand", note: "Resources become code the user owns.",
    rows: [
      ["npx paper-motion add <id> --set key=value", "Run it in the project root with exactly the --set arguments from the reply. Moves go to moves/, backgrounds to brand/shader-set/set.json, palettes and fonts to brand/tokens.json, recipes to pieces/<id>/."],
      ["npx paper-motion add <id> --force", "add never overwrites a value already in the project. Pass --force when the user chooses or tunes again something you installed before."],
    ],
  },
  {
    id: "inventory", title: "Content", stages: "content", note: "What the video can really show. Nothing goes in that is not true.",
    rows: [
      ["npx paper-motion inventory <piece> --from <url> --from README.md --from brand", "Reads a site (and screenshots it), a markdown file, a folder or the brand, and adds what it finds as proposals for the user to keep or remove. Run it again any time: it never proposes twice. Add --plain when the audience does not code: commands and code are left out."],
      ["npx paper-motion inventory <piece>", "Checks pieces/<piece>/inventory.json and says what is missing: nothing shows the product, nothing proves it, an item still incomplete."],
      ["npx paper-motion inventory <piece> --remove id,… --must id,… --set id.field=value", "Drops the noise, marks what has to appear, corrects a field."],
      ["<command> 2>&1 | npx paper-motion inventory <piece> --output <id>", "Gives a command its real output. Review refuses while an item is incomplete."],
      ["npx paper-motion inventory kinds", "The kinds of content (a figure, a sentence, a screen, a command…), their fields and the blocks that show each."],
      ["npx paper-motion plan <piece> --seconds 30", "Up to three structures from what the user kept, the same content argued in three orders. The studio uses the first when it builds the video."],
    ],
  },
  {
    id: "chain", title: "Chain", stages: "video, final", note: "A structure becomes a chain: its parts in order, rendered and joined. The studio runs these itself; they are yours when the user asks.",
    rows: [
      ["npx paper-motion chain init <piece> --plan A", "Installs the plan's structure A under pieces/<piece>/ with the content already in each part's CONFIG, and writes chain.json: the seconds of each part and the join between them. --board <link> --option D takes a structure chosen on a board instead."],
      ["npx paper-motion chain <piece> --check", "Plans without rendering: each part's length and speed (it always plays its whole scene, 1.6× faster to 0.6× slower), and the joins. Run it after writing the parts."],
      ["npx paper-motion chain <piece> --drafts", "A quick render of each part on its own. Add --only <dir> to redo one part."],
      ["npx paper-motion chain <piece> --draft", "A quick render of the parts joined."],
      ["npx paper-motion chain <piece> --motion-blur 5", "The full render: every part in the brand's look, joined into one video."],
    ],
  },
];

const NAV: [string, string][] = [["#prompt", "Starter prompt"], ["#stages", "Four stages"], ["#run", "One piece, start to finish"], ["#commands", "Commands"], ["#entry", "Entry points"]];

export default function DocsPage() {
  const { site, count } = getIndex();
  const PROMPT = prompt(site);
  const endpoints: [string, string][] = [
    ["/llms.txt", "The flow, the metadata to choose with, the board link format and every resource in one line. Read it first."],
    ["/llms-full.txt", "The full catalog in text: params, notes and usage for each resource."],
    ["/registry.json", "The index: id, type, title, summary, tags and the metadata of each resource."],
    ["/r/<id>.json", "One resource: params with ranges, install instructions, usage and the file contents."],
    ["/schema.json", "The JSON Schema every resource follows."],
    ["/b/<id>", "A board as a short link, stored for 90 days."],
    ["/b#<payload>", "A board carried in the link itself: the payload is base64url(deflate-raw(JSON)) and never reaches the server."],
  ];
  return (
    <div className="pb-28">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9 pt-12 md:pt-16">
        <h1 className="display">For agents</h1>
        <p className="max-w-[46ch] pb-2 text-[15px] leading-relaxed text-muted">
          paper-motion is built to be driven by an AI agent. The agent proposes and builds; the user decides each stage
          in the studio, a page on their own machine.
        </p>
      </div>

      <nav aria-label="On this page" className="sticky top-[52px] z-30 -mx-5 border-y border-line bg-ground md:-mx-10">
        <div className="cells overflow-x-auto text-[12.5px] [scrollbar-width:none] [&>*:first-child]:border-l-0">
          {NAV.map(([href, label], i) => (
            <a key={href} href={href} className={`cell h-11 shrink-0 ${i === 0 ? "pl-5 md:pl-10" : ""}`}>{label}</a>
          ))}
          <span className="cell ml-auto h-11 shrink-0 font-mono text-[12px] max-sm:hidden md:pr-10">{count} resources</span>
        </div>
      </nav>

      <section id="prompt" className="scroll-mt-[96px] pt-14">
        <div className="corner-marks max-w-[860px] border border-rule bg-ground">
          <div className="flex items-stretch justify-between border-b border-line">
            <h2 className="flex items-center gap-2.5 px-5 py-3 text-[14px] font-medium"><IconAgent size={16} className="text-paper" />The starter prompt</h2>
            <CopyButton text={PROMPT} label="Copy prompt" className="btn-primary border-y-0 border-r-0" />
          </div>
          <p className="break-words px-5 py-6 font-mono text-[15px] leading-relaxed text-figure md:text-[16.5px]">{PROMPT}</p>
          <p className="border-t border-line px-5 py-3.5 text-[13px] leading-relaxed text-muted">
            The user pastes it in Claude Code, Codex, Cursor or any agent that reads the web and runs commands. From there the agent
            reads llms.txt, installs the skills and the engine, and follows the make-video skill.
          </p>
          <p className="border-t border-line px-5 py-3.5 text-[13px] leading-relaxed text-figure">
            If you are the person and not the agent: this prompt is all you type. Everything below is run by your agent; you only open the studio and decide.
          </p>
        </div>
      </section>

      <section id="stages" className="scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9">
          <h2 className="title">Four stages</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            A video is made in four stages. The user approves each one in the studio, and edits the video there themselves. Nothing moves on until they do.
          </p>
        </div>
        <ol className="sheet sm:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((s, i) => (
            <li key={s.t} className="group relative flex gap-4 px-4 pb-4 pt-3.5 transition-colors duration-150 hover:bg-paper hover:text-ground sm:min-h-[196px] sm:flex-col xl:min-h-[232px] sm:gap-0">
              <span className="num w-11 shrink-0 text-[26px] group-hover:!text-ground">0{i + 1}</span>
              <div className="min-w-0 sm:pt-7">
                <h3 className="text-[17px] font-medium leading-tight"><a href={`#run-${s.id}`} className="outline-offset-4 after:absolute after:inset-0">{s.t}</a></h3>
                <p className="mt-1.5 text-[13.5px] leading-snug text-muted group-hover:text-ground/70">{s.d}</p>
              </div>
              <ul className="max-sm:hidden sm:mt-auto sm:pt-5">
                {s.cmds.map((c) => <li key={c} className="truncate font-mono text-[12px] leading-[1.6] text-muted group-hover:text-ground/70">{c}</li>)}
              </ul>
            </li>
          ))}
        </ol>
        <div className="rows mt-12 max-w-[980px]">
          {WHO.map(([k, d]) => (
            <div key={k} className="row">
              <h3 className="text-[14px]">{k}</h3>
              <p className="text-[15px] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="run" className="scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9">
          <h2 className="title">One piece, start to finish</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            Every command of a real piece, in the order it is run: paper-motion&rsquo;s own film, the one on the home page. Each stage ends with a review, and the next one waits for it.
          </p>
        </div>
        <ol className="border-t border-rule">
          {RUN.map((r, i) => (
            <li key={r.stage} id={`run-${r.id}`} className="grid scroll-mt-[110px] grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 border-b border-line py-5 md:grid-cols-[150px_minmax(0,1fr)]">
              <h3 className="flex items-baseline gap-3 md:block">
                <span className="num text-[22px]">{i ? `0${i}` : "00"}</span>
                <span className="text-[16px] font-medium md:mt-2 md:block">{r.stage}</span>
              </h3>
              <ul className="min-w-0 space-y-2">
                {r.steps.map((st) => "cmd" in st
                  ? <li key={st.cmd} className="min-w-0"><CopyLine prefix="$" text={st.cmd} /></li>
                  : <li key={st.say} className="border-l-2 border-rule py-1 pl-4 text-[14px] leading-relaxed text-muted">{st.say}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section id="commands" className="@container scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className="title">Commands</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            The reference: every command of <code className="font-mono text-[13px] text-figure">npx paper-motion</code> with what it does, grouped by job. Each group names the stages it serves.
          </p>
        </div>
        {COMMANDS.map((g) => (
          <div key={g.id} className="pt-11">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1.5 border-b border-rule pb-3">
              <h3 className="font-serif text-[28px] leading-none tracking-[-0.02em]">{g.title}</h3>
              <p className="text-[13px] text-muted"><span className="tag mr-3 !py-1 !text-[11px]">{g.stages}</span>{g.note}</p>
            </div>
            <ul>
              {g.rows.map(([cmd, what]) => (
                <li key={cmd} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-8 gap-y-2.5 border-b border-line py-3 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <CopyLine prefix="$" text={cmd} />
                  <p className="text-[14px] leading-relaxed text-muted">{what}</p>
                </li>
              ))}
              {g.prints?.map(([line, what]) => (
                <li key={line} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-8 gap-y-2.5 border-b border-line py-3 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <code className="block overflow-x-auto whitespace-nowrap border-l-2 border-paper py-2 pl-4 font-mono text-[13px] text-figure">{line}</code>
                  <p className="text-[14px] leading-relaxed text-muted">{what}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="entry" className="scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9">
          <h2 className="title">Entry points</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            The machine-readable ways in. They all live under <span className="break-all font-mono text-[13px] text-figure">{site}</span>
          </p>
        </div>
        <div className="rows">
          {endpoints.map(([p, d]) => (
            <div key={p} className="row">
              {p.includes("<") ? <code className="font-mono text-[13px] text-figure">{p}</code> : (
                <a href={p} className="w-fit font-mono text-[13px] text-figure underline decoration-rule underline-offset-4 hover:bg-figure hover:text-ground">{p}</a>
              )}
              <p className="text-[14px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
          <div className="row">
            <code className="font-mono text-[13px] text-figure">/mcp</code>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
              <p className="text-[14px] leading-relaxed text-muted">
                The same registry as tools, with no install: search, resource, recolor, board (it waits for the choice) and board_choice.
                Streamable HTTP, no auth. Add it to the agent before opening a session. Installing stays with <code className="font-mono text-[13px] text-figure">npx paper-motion add</code>.
              </p>
              <div className="max-w-[560px]"><CopyLine text={`${site}/mcp`} /></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
