"use client";

// What the monitor shows as paper-motion's own film takes shape, one scene per stage. Color only arrives through a
// shader, in the brand sheet's tints (sage, slate, clay, ochre); type and interface stay black and white.
// The film is real: library blocks rendered by the engine on the chosen look (film.tsx).
// The monitor is a container: everything inside is sized in cqi, so the same scene reads at 1440 and in a phone stack.
import { memo, type ReactNode } from "react";
import { IconCheck } from "@/components/icons";
import { ShaderPreview } from "@/components/shader-preview";
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

// 2 · Look: four looks in the brand's tints, one chosen
function Board({ looks, done, still, free }: { looks: Look[]; done: boolean; still: boolean; free: boolean }) {
  return (
    <Frame free={free} where="a board, in your browser" state={done ? <Done>C, clay</Done> : <Waiting>choose one</Waiting>}>
      <div className={`grid grid-cols-2 gap-[max(6px,1cqi)] ${free ? "" : "mx-auto w-[min(100%,70cqi)]"}`}>
        {looks.map((l) => {
          const on = done && l.label === "C", off = done && !on;
          return (
            <div key={l.id} className={`relative aspect-video overflow-hidden bg-black transition-opacity duration-700 ${on ? "outline outline-1 outline-offset-[3px] outline-figure" : ""} ${off ? "opacity-25" : ""}`}>
              <ShaderPreview entry={l.entry} still={still} className="!absolute inset-0" />
              <span className={`absolute left-[5%] top-[7%] flex items-baseline gap-[0.6em] font-mono text-figure ${small}`}>
                <span className="font-pixel">{l.label}</span>{l.title}
              </span>
              <span className="absolute bottom-[9%] left-[5%] font-serif text-[length:max(16px,2.8cqi)] tracking-[-0.02em] text-figure">paper-motion</span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

export const BEATS = SCENES.map((x) => ({ id: x.id, beat: x.beat, s: x.d }));

// 3 · Structure: five beats, each as long as it lasts
function Structure({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="six beats" state={done ? <Done>approved</Done> : <Waiting>to review</Waiting>}>
      <div className="flex gap-[2px]">
        {BEATS.map((b, k) => (
          <div key={b.id} className="min-w-0" style={{ flex: b.s }}>
            <div className="h-[max(64px,16cqi)]"><Part k={k} poster /></div>
            <p className="mt-[1.4cqi] font-pixel text-[length:max(13px,1.8cqi)] leading-none text-muted">{k + 1}</p>
            <p className="mt-[0.8cqi] truncate font-mono text-[length:max(10px,1.1cqi)] text-muted">{b.id}</p>
            <p className="mt-[0.5cqi] truncate font-serif text-[length:max(14px,2.1cqi)] leading-[1.1] tracking-[-0.01em]">{b.beat}</p>
            <p className="font-mono text-[length:max(10px,1.1cqi)] text-faint">{b.s} s</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// 4 · Parts: one part plays; the count ticks as you approve them
function Parts({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="part 3 of 6, the library" state={done ? <Done>6 of 6 approved</Done> : <Waiting>rendering drafts</Waiting>}>
      <div className={free ? "" : "mx-auto w-[min(100%,74cqi)]"}>
        <div className="aspect-video"><Part k={2} /></div>
        <div className="mt-[1.2cqi] flex gap-[2px]">
          {BEATS.map((b, k) => (
            <i key={b.id} className="block h-[max(3px,0.4cqi)] transition-colors duration-300" style={{ flex: b.s, background: done || k < 3 ? "#fff" : "#2e2e2e", transitionDelay: done ? `${k * 110}ms` : "0ms" }} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

// 5 · Assembly: the parts joined by whips, played through
function Assembly({ done, free }: { done: boolean; free: boolean }) {
  return (
    <Frame free={free} where="the assembly, joined by whips" state={done ? <Done>approved</Done> : <Waiting>joining</Waiting>}>
      <div className={free ? "" : "mx-auto w-[min(100%,74cqi)]"}>
        <Film timeline />
      </div>
    </Frame>
  );
}

// 6 · Final: the film, edge to edge
function Final({ done }: { done: boolean }) {
  return (
    <div className="relative h-full w-full">
      <Film />
      <span className="absolute bottom-[4%] right-[3%]">{done ? <Done>paper-motion.mp4</Done> : <Waiting>rendering every frame</Waiting>}</span>
    </div>
  );
}

/** Stages 0 and 6 are films and keep 16:9 even when `free`; the rest are scenes with a label. */
export const isFilm = (stage: number) => stage === 0 || stage === 6;

export const Screen = memo(function Screen({ stage, done, looks, still, free = false }: { stage: number; done: boolean; looks: Look[]; still: boolean; free?: boolean }) {
  if (stage === 1) return <Brief done={done} free={free} />;
  if (stage === 2) return <Board looks={looks} done={done} still={still} free={free} />;
  if (stage === 3) return <Structure done={done} free={free} />;
  if (stage === 4) return <Parts done={done} free={free} />;
  if (stage === 5) return <Assembly done={done} free={free} />;
  if (stage === 6) return <Final done={done} />;
  return <Opening />;
});
