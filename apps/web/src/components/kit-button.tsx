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
      <button type="button" onClick={toggle} className={`btn ${same ? "" : "btn-primary"}`}>
        {same ? <IconCheck size={15} /> : <IconKit size={15} />}
        {same ? "In your kit" : inKit ? "Update in kit" : "Add to kit"}
      </button>
    );
  }
  // on a card: a square in the corner, there when you point at the card, paper once the resource is in the kit
  return (
    <button type="button" onClick={toggle} title={inKit ? "Remove from kit" : "Add to kit"} className={`flex h-7 items-center gap-1.5 border px-2 font-mono text-[11px] ${inKit ? "border-paper bg-paper text-ground" : "border-rule bg-ground text-figure opacity-0 hover:border-figure hover:bg-figure hover:text-ground focus-visible:opacity-100 group-hover:opacity-100"}`}>
      {inKit ? <IconCheck size={12} /> : <IconPlus size={12} />}
      {inKit ? "In kit" : "Kit"}
    </button>
  );
}
