"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemText,
  CommandList,
} from "@ui-sdk/react/command";
import { Dialog, DialogBackdrop, DialogContent, DialogShortcut, DialogTitle, DialogTrigger } from "@ui-sdk/react/dialog";
import { IconSearch } from "./icons";

export type SearchItem = { slug: string; title: string; summary: string; format: string; techniques: string[] };

/** ⌘K: find a video by its title, its summary or a technique, and open it. */
export function SearchPalette({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger shortcut="mod+k" className="btn h-full min-w-[220px] justify-between border-0 border-l border-line px-4 text-muted">
        <span className="flex items-center gap-2">
          <IconSearch size={14} />
          Search videos
        </span>
        <DialogShortcut className="font-mono text-[11px] text-faint" />
      </DialogTrigger>
      <DialogBackdrop className="palette-backdrop" />
      <DialogContent className="palette">
        <DialogTitle className="sr-only">Search videos</DialogTitle>
        <Command
          filter="contains"
          onAction={(slug) => {
            setOpen(false);
            router.push(`/v/${slug}`);
          }}
        >
          <div className="flex items-center gap-3 border-b border-line px-4">
            <IconSearch size={16} className="shrink-0 text-muted" />
            <CommandInput aria-label="Search videos" placeholder="A title or a technique: glass, logo, springs…" className="palette-input" />
          </div>
          <CommandEmpty className="px-4 py-6 text-[14px] text-muted">Nothing matches. Try a technique, like “camera moves”.</CommandEmpty>
          <CommandList className="max-h-[50vh] overflow-y-auto">
            <CommandGroup>
              <CommandGroupLabel className="px-4 pb-1 pt-3 font-mono text-[11px] text-faint">Videos</CommandGroupLabel>
              {items.map((it) => (
                <CommandItem
                  key={it.slug}
                  value={it.slug}
                  label={it.title}
                  aria-label={it.title}
                  keywords={[it.summary, it.format, ...it.techniques]}
                  className="palette-item"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <CommandItemText className="font-serif text-[18px] leading-none" />
                    <span className="truncate text-[12px] text-muted">{it.techniques.join(" · ")}</span>
                  </span>
                  <span className="tag shrink-0">{it.format}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
