import type { Metadata } from "next";
import { CopyButton, CopyLine } from "@/components/copy-button";
import { IconAgent } from "@/components/icons";
import { starterPrompt as prompt } from "@/lib/prompt";
import { getIndex } from "@/lib/registry";

export const metadata: Metadata = { title: "For agents" };

// the same prompt the home page hands to the user

// the six stages of a piece, the same ones the studio shows: what the agent prepares before handing each one over
const STAGES: { t: string; d: string; cmds: string[] }[] = [
  { t: "Brief", d: "Interview the user, then fill the five fields: what, who, format, tone and action.", cmds: ["piece init"] },
  { t: "Look", d: "Boards for palette, type, backgrounds and moves. Install what they choose.", cmds: ["board", "add"] },
  { t: "Structure", d: "A board of structures whose beats name their blocks. The one they choose becomes a chain.", cmds: ["board", "chain init"] },
  { t: "Parts", d: "Write each part from its beat, then render each one on its own, quick.", cmds: ["chain --drafts"] },
  { t: "Assembly", d: "The parts joined, quick.", cmds: ["chain --draft"] },
  { t: "Final", d: "The full render.", cmds: ["chain --motion-blur 5"] },
];

const WHO: [string, React.ReactNode][] = [
  ["The user", "Sees each stage in the studio, a local page. Approves it or asks for changes, and edits by hand what needs no judgment: the brief, the words on screen, lengths, joins and order."],
  ["The agent", <>Hands over a stage with <code className="font-mono text-[13px] text-figure">piece review</code> and waits. The decision arrives on its own, as lines the command prints: an approval, a change to make, or an edit the user already made. Build on those edits, never undo them.</>],
  ["Boards", "Visual choices (palette, type, backgrounds, moves, structure) are proposed on boards: links the user opens to compare and choose. Boards shared while a piece is open also show in its studio."],
  ["Without a browser", "Only when the user can't open one, run the same stages in the chat."],
];

const BOARD_CMD = `npx paper-motion board --url --title "Backgrounds for Kiln" --look cobalt,geist --option mesh-graphite --note "quiet, graphite" --option neuro-slate --note "a technical web" --option "dither-slate:colorFront=#3d6bff" --note "pixels in your accent" --option grain-slate`;

type Group = { id: string; title: string; note: string; rows: [string, string][]; prints?: [string, string][] };
const COMMANDS: Group[] = [
  {
    id: "setup", title: "Set up", note: "The skills and the engine. Every command answers --help.",
    rows: [
      ["npx skills add solanodz/paper-motion", "The skills. Read make-video right after installing and follow it in this session."],
      ["npx paper-motion setup", "The engine: Node 18+, ffmpeg and Chrome."],
    ],
  },
  {
    id: "studio", title: "The studio", note: "Where the user decides. Start the piece right after setup.",
    rows: [
      [`npx paper-motion piece init <piece> --title "…"`, "Starts a piece, and the project's studio in the background."],
      [`npx paper-motion piece init <piece> --what "…" --who "…" --format "…" --tone "…" --action "…"`, "Writes the brief, after the interview."],
      ["npx paper-motion piece review <piece> <stage>", "Hands a stage to the user. The first time it opens the studio in their browser. It waits for their decision and prints what they did, one line each."],
      ["npx paper-motion piece status <piece>", "Shows where everything stands and what you haven't read."],
      ["npx paper-motion studio --stop", "Ends the background studio when the piece is done."],
    ],
  },
  {
    id: "boards", title: "Boards", note: "One link per visual decision, with two to four options from the registry.",
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
    id: "install", title: "Install", note: "Resources become code the user owns.",
    rows: [
      ["npx paper-motion add <id> --set key=value", "Run it in the project root with exactly the --set arguments from the reply. Moves go to moves/, backgrounds to brand/shader-set/set.json, palettes and fonts to brand/tokens.json, recipes to pieces/<id>/."],
      ["npx paper-motion add <id> --force", "add never overwrites a value already in the project. Pass --force when the user chooses or tunes again something you installed before."],
    ],
  },
  {
    id: "chain", title: "Chain", note: "A chosen structure becomes a chain: its parts in order, rendered and joined.",
    rows: [
      ["npx paper-motion chain init <piece> --board <id> --option D", "Installs each beat's block under pieces/<piece>/ and writes chain.json: the seconds of each part and the join between them. Review the structure stage right after, before writing the parts."],
      ["npx paper-motion chain <piece> --drafts", "A quick render of each part on its own, for the parts stage."],
      ["npx paper-motion chain <piece> --draft", "A quick render of the parts joined, for the assembly stage."],
      ["npx paper-motion chain <piece> --motion-blur 5", "The full render: every part in the brand's look, joined into one video."],
    ],
  },
];

const NAV: [string, string][] = [["#prompt", "Starter prompt"], ["#stages", "Six stages"], ["#commands", "Commands"], ["#entry", "Entry points"]];

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
        </div>
      </section>

      <section id="stages" className="scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9">
          <h2 className="title">Six stages</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            A video is made in six stages. The user watches and approves each one in the studio. Nothing moves on until they do.
          </p>
        </div>
        <ol className="sheet sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {STAGES.map((s, i) => (
            <li key={s.t} className="flex gap-4 px-4 pb-4 pt-3.5 sm:min-h-[196px] sm:flex-col 2xl:min-h-[244px] sm:gap-0">
              <span className="num w-11 shrink-0 text-[26px]">0{i + 1}</span>
              <div className="min-w-0 sm:pt-7">
                <h3 className="text-[17px] font-medium leading-tight">{s.t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{s.d}</p>
              </div>
              <ul className="max-sm:hidden sm:mt-auto sm:pt-5">
                {s.cmds.map((c) => <li key={c} className="truncate font-mono text-[12px] leading-[1.6] text-muted">{c}</li>)}
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

      <section id="commands" className="@container scroll-mt-[96px] pt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className="title">Commands</h2>
          <p className="max-w-[46ch] pb-1 text-[15px] leading-relaxed text-muted">
            The CLI is <code className="font-mono text-[13px] text-figure">npx paper-motion</code>. The groups follow the order of a piece.
          </p>
        </div>
        {COMMANDS.map((g) => (
          <div key={g.id} className="pt-11">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1.5 border-b border-rule pb-3">
              <h3 className="font-serif text-[28px] leading-none tracking-[-0.02em]">{g.title}</h3>
              <p className="text-[13px] text-muted">{g.note}</p>
            </div>
            <ul>
              {g.rows.map(([cmd, what]) => (
                <li key={cmd} className="grid items-center gap-x-8 gap-y-2.5 border-b border-line py-3 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <CopyLine prefix="$" text={cmd} />
                  <p className="text-[14px] leading-relaxed text-muted">{what}</p>
                </li>
              ))}
              {g.prints?.map(([line, what]) => (
                <li key={line} className="grid items-center gap-x-8 gap-y-2.5 border-b border-line py-3 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
            <div className="grid gap-3">
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
