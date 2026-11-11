"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";

/** Copies `text`; says "Copied" for a moment. */
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
      className={`btn btn-sm shrink-0 ${done ? "btn-primary" : ""} ${className}`}
    >
      {done ? <IconCheck size={14} /> : <IconCopy size={14} />}
      {done ? "Copied" : label}
    </button>
  );
}

/** A one-line command or prompt with a copy button. */
export function CopyLine({ text, prefix }: { text: string; prefix?: string }) {
  return (
    <div className="code flex items-stretch">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-figure">
        {prefix ? <span className="select-none text-faint">{prefix} </span> : null}
        {text}
      </code>
      <CopyButton text={text} className="border-y-0 border-r-0 border-line" />
    </div>
  );
}
