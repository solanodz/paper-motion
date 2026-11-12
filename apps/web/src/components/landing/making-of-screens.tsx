"use client";

// What the monitor shows as paper-motion's own film takes shape, one scene per stage. Color only arrives through the
// film's own shaders; type and interface stay black and white.
// The film is real: library blocks rendered by the engine on the chosen look (film.tsx).
// The monitor is a container: everything inside is sized in cqi, so the same scene reads at 1440 and in a phone stack.
import { memo, type ReactNode } from "react";
import { IconCheck } from "@/components/icons";
import { Film, Part, SCENES } from "./film";

type Entry = { shader: string; props: Record<string, unknown>; image?: string; background?: string };
export type Look = { id: string; label: string; title: string; tint: string; entry: Entry };

const small = "text-[length:max(11px,1.2cqi)]";

const Done = ({ children }: { children: ReactNode }) => <span className="tag !border-figure/40 !py-1 !text-[11px] !text-figure"><IconCheck size={12} />{children}</span>;
const Waiting = ({ children }: { children: ReactNode }) => (
  <span className={`flex items-center gap-2 font-mono text-muted ${small}`}><i className="block h-1.5 w-1.5 animate-pulse bg-figure motion-reduce:animate-none" />{children}</span>
);

/** A scene: a small label and the state in one quiet line on top, the scene below. */
function Frame({ where, state, free, children }: { where: string; state: ReactNode; free: boolean; children: ReactNode }) {
  return (
    <div className={free ? "px-4 py-5" : "flex h-full flex-col px-[4cqi] py-[3.4cqi]"}>
      <div className="flex items-center justify-between gap-6">
        <p className={`font-mono text-muted ${small}`}>{where}</p>
        {state}
      </div>
      <div className={free ? "mt-5" : "flex min-h-0 flex-1 flex-col justify-center pt-[2cqi]"}>{children}</div>
    </div>
  );
}

// 0 · the opening: the finished film, playing
const Opening = () => <Film />;

// 1 · Brief: the film's one line, written down
function Brief({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="the brief" state={done ? <Done>approved</Done> : <Waiting>writing</Waiting>}>
      <p className="max-w-[18ch] font-serif text-[length:max(26px,5.6cqi)] leading-[1.02] tracking-[-0.025em]">Art-directed video, made from a conversation with your agent.</p>
      <p className={`mt-[3cqi] font-mono text-muted ${small}`}>for people who build with coding agents · 16:9 · 30 s · ends on paper-motion.app</p>
    </Frame>
  );
}

export const BEATS = SCENES.map((x) => ({ id: x.id, beat: x.beat, s: x.d }));

// 2 · Content: what the film can really show, read from the site and the README; the user keeps what is true
const THINGS: { kind: string; what: string; k?: number }[] = [
  { kind: "a sentence", what: "Art-directed video, made from a conversation", k: 0 },
  { kind: "a command", what: "the one line your agent runs", k: 1 },
  { kind: "a screen", what: "the library, on paper-motion.app", k: 2 },
  { kind: "a list", what: "your approvals, one by one", k: 3 },
  { kind: "three numbers", what: "what the library holds", k: 4 },
  { kind: "the name", what: "paper-motion, in liquid metal", k: 5 },
  { kind: "a table", what: "install options, per agent" },
];

function Content({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="what it says, from your site and README" state={done ? <Done>6 kept</Done> : <Waiting>keep what is true</Waiting>}>
      <ul className={`border-t border-figure/15 ${free ? "" : "mx-auto w-[min(100%,74cqi)]"}`}>
        {THINGS.map((x, i) => {
          const out = x.k === undefined;
          return (
            <li key={x.what} className={`flex items-center gap-[1.6cqi] border-b border-figure/15 py-[max(5px,0.8cqi)] transition-opacity duration-500 ${done && out ? "opacity-30" : ""}`} style={{ transitionDelay: done ? `${i * 60}ms` : "0ms" }}>
              <span className="block aspect-video w-[max(44px,7.5cqi)] shrink-0 overflow-hidden bg-figure/10">{x.k !== undefined ? <Part k={x.k} poster /> : null}</span>
              <span className={`w-[max(84px,13cqi)] shrink-0 font-mono text-muted ${small}`}>{x.kind}</span>
              <span className={`min-w-0 flex-1 truncate font-serif text-[length:max(14px,2cqi)] tracking-[-0.01em] ${done && out ? "line-through" : ""}`}>{x.what}</span>
              <span className={`shrink-0 font-mono ${small} ${done ? "text-figure" : "text-faint"}`}>{done ? (out ? "not this" : "keep") : "?"}</span>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

// 3 · Video: the studio built it from what was kept; the user edits it, live
function Video({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="your video, in the studio" state={done ? <Done>approved</Done> : <Waiting>building from what you kept</Waiting>}>
      <div className={free ? "" : "mx-auto w-[min(100%,74cqi)]"}>
        <Film timeline />
        <p className={`mt-[1.4cqi] font-mono text-muted ${small}`}>words · motion · background · tune · transition · length · order · style</p>
      </div>
    </Frame>
  );
}

// 4 · Final: the film, edge to edge
function Final({ done }: { done: boolean }) {
  return (
    <div className="relative h-full w-full">
      <Film />
      <span className="absolute bottom-[4%] right-[3%]">{done ? <Done>paper-motion.mp4</Done> : <Waiting>rendering every frame</Waiting>}</span>
    </div>
  );
}

/** Stages 0 and 4 are films and keep 16:9 even when `free`; the rest are scenes with a label. */
export const isFilm = (stage: number) => stage === 0 || stage === 4;

// `looks` and `still` are kept for the callers; no stage plays a shader of its own any more
export const Screen = memo(function Screen({ stage, done, free = false }: { stage: number; done: boolean; looks: Look[]; still: boolean; free?: boolean }) {
  if (stage === 1) return <Brief done={done} free={free} />;
  if (stage === 2) return <Content done={done} free={free} />;
  if (stage === 3) return <Video done={done} free={free} />;
  if (stage === 4) return <Final done={done} />;
  return <Opening />;
});
