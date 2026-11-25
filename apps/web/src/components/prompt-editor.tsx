"use client";

import { Fragment, useEffect, useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Toast, ToastDescription, ToastRegion, ToastTitle, createToaster } from "@ui-sdk/react/toast";
import { IconCopy, IconFile } from "./icons";

type Variable = { key: string; label: string; default: string };

function fill(template: string, variables: Variable[], values: Record<string, string>) {
  const def = Object.fromEntries(variables.map((v) => [v.key, v.default]));
  return template.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, k: string) => values[k]?.trim() || def[k] || "");
}

/**
 * The prompt, made yours: one field per variable fills its slots live, the filled values are marked in the text,
 * and Copy takes the whole thing, director's pass included.
 */
export function PromptEditor({
  slug,
  template,
  variables,
  director,
}: {
  slug: string;
  template: string;
  variables: Variable[];
  director: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [toast] = useState(() => createToaster());
  useEffect(() => () => toast.dismiss(), [toast]);

  const def = Object.fromEntries(variables.map((v) => [v.key, v.default]));
  const parts = template.split(/(\{\{[a-z0-9_]+\}\})/g);
  const full = `${fill(template, variables, values)}\n\n${director}\n`;

  return (
    <div className="grid border-y border-line lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6 border-b border-line p-5 md:p-8 lg:border-b-0 lg:border-r">
        <div>
          <h2 className="title text-[34px] md:text-[40px]">Make it yours</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {variables.length
              ? "Change any of these and the prompt changes with it. Leave one empty to keep what made the video."
              : "This prompt has nothing to fill in. Copy it as it is."}
          </p>
        </div>
        {variables.map((v) => (
          <Field key={v.key} className="flex flex-col gap-2">
            <FieldLabel className="text-[13px] text-muted">{v.label}</FieldLabel>
            <Input
              className="field text-[15px]"
              placeholder={v.default}
              value={values[v.key] ?? ""}
              onValueChange={(value) => setValues((s) => ({ ...s, [v.key]: value }))}
            />
          </Field>
        ))}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(full);
                toast("Prompt copied", { description: "Paste it into your agent, in the folder where the video should go." });
              } catch {
                toast("Couldn't copy", { description: "Your browser blocked the clipboard. Select the text instead." });
              }
            }}
          >
            <IconCopy size={14} />
            Copy prompt
          </Button>
          <a className="btn" href={`/v/${slug}/prompt.md`}>
            <IconFile size={14} />
            Plain text
          </a>
        </div>
      </div>

      <div className="min-w-0 bg-surface">
        <pre className="max-h-[70vh] overflow-auto p-5 font-mono text-[13px] leading-[1.7] text-figure md:p-8">
          <code className="block max-w-[82ch] whitespace-pre-wrap">
          {parts.map((p, i) => {
            const m = p.match(/^\{\{([a-z0-9_]+)\}\}$/);
            if (!m) return <Fragment key={i}>{p}</Fragment>;
            const mine = values[m[1]]?.trim();
            return (
              <mark key={i} className={mine ? "slot slot-on" : "slot"} title={variables.find((v) => v.key === m[1])?.label}>
                {mine || def[m[1]]}
              </mark>
            );
          })}
          {"\n\n"}
          <span className="text-muted">{director}</span>
          </code>
        </pre>
      </div>

      <ToastRegion toaster={toast} side="bottom" align="end" className="toasts">
        {() => (
          <Toast className="toast">
            <ToastTitle className="text-[14px] font-medium" />
            <ToastDescription className="mt-1 text-[13px] text-muted" />
          </Toast>
        )}
      </ToastRegion>
    </div>
  );
}
