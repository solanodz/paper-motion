"use client";

import { kit, useKit } from "@/lib/kit";
import { IconCheck, IconKit, IconPlus } from "./icons";

/** Adds a resource to the kit (with its default settings, or the ones given), or takes it out. */
export function KitButton({ id, type, title, values = {}, variant = "chip" }: { id: string; type: string; title: string; values?: Record<string, unknown>; variant?: "chip" | "solid" }) {
  const k = useKit();
  const inKit = k.items.find((i) => i.id === id);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inKit && variant === "chip") kit.remove(id);
    else kit.add({ id, type, title, values });
  };
  if (variant === "solid") {
    const same = inKit && JSON.stringify(inKit.values) === JSON.stringify(values);
    return (
      <button type="button" onClick={toggle} className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors ${same ? "bg-raised text-paper" : "bg-paper text-ground hover:bg-figure"}`}>
        {same ? <IconCheck size={15} /> : <IconKit size={15} />}
        {same ? "In your kit" : inKit ? "Update in kit" : "Add to kit"}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} title={inKit ? "Remove from kit" : "Add to kit"} className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] backdrop-blur transition-all ${inKit ? "border-paper bg-paper text-ground" : "border-line bg-ground/70 text-figure opacity-0 group-hover:opacity-100 hover:border-faint"}`}>
      {inKit ? <IconCheck size={12} /> : <IconPlus size={12} />}
      {inKit ? "in kit" : "kit"}
    </button>
  );
}
