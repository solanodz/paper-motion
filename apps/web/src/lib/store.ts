// The site's one piece of state: boards and the choices made on them, in a key-value store with expiry.
// Upstash Redis when the Vercel integration has set its variables; an in-memory map otherwise (dev, tests), which
// forgets everything when the process restarts and is never shared between instances.
import { Redis } from "@upstash/redis";

export const BOARD_TTL = 90 * 24 * 3600; // seconds a board lives
export const ID_LENGTH = 8;

type Store = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Increments a counter that expires `ttl` seconds after its first increment; returns the new count. */
  incr(key: string, ttl: number): Promise<number>;
};

function upstash(): Store | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token });
  return {
    get: (k) => r.get(k),
    set: async (k, v, ttl) => { await r.set(k, v, { ex: ttl }); },
    del: async (k) => { await r.del(k); },
    incr: async (k, ttl) => { const n = await r.incr(k); if (n === 1) await r.expire(k, ttl); return n; },
  };
}

function memory(): Store {
  const g = globalThis as unknown as { __pmStore?: Map<string, { v: unknown; exp: number }> };
  const m = (g.__pmStore ??= new Map());
  const live = (k: string) => { const e = m.get(k); if (!e) return null; if (e.exp < Date.now()) { m.delete(k); return null; } return e; };
  return {
    get: async (k) => (live(k)?.v as never) ?? null,
    set: async (k, v, ttl) => { m.set(k, { v, exp: Date.now() + ttl * 1000 }); },
    del: async (k) => { m.delete(k); },
    incr: async (k, ttl) => { const e = live(k); const n = ((e?.v as number) ?? 0) + 1; m.set(k, { v: n, exp: e?.exp ?? Date.now() + ttl * 1000 }); return n; },
  };
}

let store: Store | null = null;
export const getStore = (): Store => (store ??= upstash() ?? memory());
/** True when boards persist beyond this process (the Upstash variables are set). */
export const storeIsDurable = () => !!(process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL);
/**
 * On Vercel without a durable store, each request may land on a different instance, so a stored board would vanish
 * at once. Short links are then refused (503) and the CLI shares the long link instead. Locally the memory store is fine.
 */
export const canStore = () => storeIsDurable() || !process.env.VERCEL;

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i: ids get read aloud and typed
export function newId(length = ID_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
export const isId = (s: unknown): s is string => typeof s === "string" && new RegExp(`^[${ALPHABET}]{${ID_LENGTH}}$`).test(s);

export type Choice = { label?: string; none?: boolean; text?: string; line: string; at: number };
export const boardKey = (id: string) => `b:${id}`;
export const choiceKey = (id: string) => `c:${id}`;

/** Per-IP budget: `limit` hits per `window` seconds. Returns whether this hit is allowed. */
export async function allow(bucket: string, ip: string, limit: number, window: number) {
  const slot = Math.floor(Date.now() / 1000 / window);
  const n = await getStore().incr(`rl:${bucket}:${ip}:${slot}`, window);
  return n <= limit;
}
export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
