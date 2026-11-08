"use client";
// The kit: the resources a user picked, each with its own settings, kept in this browser. Every door (quiz, brand,
// library) fills it; it becomes one prompt and one command for the user's agent.
import { useSyncExternalStore } from "react";

export type KitItem = { id: string; type: string; title: string; values: Record<string, unknown> };
export type Kit = { name: string; items: KitItem[] };

const KEY = "pm:kit";
const EMPTY: Kit = { name: "", items: [] };
let cache: Kit | null = null;
const listeners = new Set<() => void>();

function read(): Kit {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "null") ?? EMPTY; } catch { cache = EMPTY; }
  return cache!;
}
function write(k: Kit) {
  cache = k;
  try { localStorage.setItem(KEY, JSON.stringify(k)); } catch { /* storage blocked: the kit lives for this page */ }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
};

export function useKit() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** One palette and one font pair at a time: adding another replaces it. Everything else stacks. */
const SINGLE = new Set(["palette", "font-pair", "recipe"]);

export const kit = {
  get: read,
  has: (id: string) => read().items.some((i) => i.id === id),
  add(item: KitItem) {
    const k = read();
    const items = k.items.filter((i) => i.id !== item.id && !(SINGLE.has(item.type) && i.type === item.type));
    write({ ...k, items: [...items, item] });
  },
  update(id: string, values: Record<string, unknown>) {
    const k = read();
    write({ ...k, items: k.items.map((i) => (i.id === id ? { ...i, values } : i)) });
  },
  remove(id: string) { const k = read(); write({ ...k, items: k.items.filter((i) => i.id !== id) }); },
  set(next: Kit) { write(next); },
  setName(name: string) { write({ ...read(), name }); },
  clear() { write(EMPTY); },
};

/** The kit's palette and font pair, if any, as the theme the previews use. */
export function kitTheme(k: Kit) {
  return { palette: k.items.find((i) => i.type === "palette"), font: k.items.find((i) => i.type === "font-pair") };
}
