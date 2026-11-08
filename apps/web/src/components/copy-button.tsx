"use client";

import { useState } from "react";

/** Copies `text`; shows "copied" for a moment. */
export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={`shrink-0 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-muted transition-colors hover:border-faint hover:text-figure ${className}`}
    >
      {done ? "copied" : label}
    </button>
  );
}

/** A one-line command or prompt with a copy button. */
export function CopyLine({ text, prefix }: { text: string; prefix?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface py-2 pl-4 pr-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-figure">
        {prefix ? <span className="select-none text-faint">{prefix} </span> : null}
        {text}
      </code>
      <CopyButton text={text} />
    </div>
  );
}
