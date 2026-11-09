// paper-motion's MCP server, remote: an agent adds https://paper-motion.vercel.app/mcp and gets the registry as tools.
// Stateless (a fresh server per request), no auth, the same per-IP budget as the board API. It never writes into
// the user's project: `pamo add` (or the agent's own file tools) does that, from the ids and values returned here.
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getIndex, getResource } from "@/lib/registry";
import { find } from "@/lib/find.mjs";
import { defaults, recolor, setArgs } from "@/lib/customize.mjs";
import { validateBoard, MAX_PAYLOAD } from "@/lib/board.mjs";
import { allow, BOARD_TTL, boardKey, canStore, type Choice, choiceKey, clientIp, getStore, newId } from "@/lib/store";

export const maxDuration = 300; // `board` may wait for the user's choice

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: "text" as const, text: msg }], isError: true });
const site = () => (process.env.PAPER_MOTION_SITE ?? "https://paper-motion.vercel.app").replace(/\/$/, "");

const pick = z.object({ id: z.string().describe("a resource id"), values: z.record(z.string(), z.unknown()).optional().describe("param values that differ from the defaults") });

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search",
      {
        title: "Search the registry",
        description: "Finds resources (component transitions, transitions, text effects, camera moves, backgrounds, palettes, font pairs, recipes) by words and by the choosing metadata. Returns the index entries: id, type, title, summary, tags, when, mood, energy, role, colors, mode, motion and the names of their params. Pass `near` with the brand's ground, figure and accent to sort backgrounds and palettes by color fit (lower `fit` is closer).",
        inputSchema: z.object({
          query: z.string().optional().describe("free words, matched against id, title, summary, tags, when and mood"),
          type: z.enum(["component", "transition", "text", "camera", "background", "palette", "font-pair", "recipe"]).optional(),
          mode: z.enum(["light", "dark"]).optional(),
          mood: z.enum(["calm", "bold", "playful", "technical", "editorial", "warm", "minimal", "luxury", "raw"]).optional(),
          motion: z.enum(["still", "gentle", "lively"]).optional().describe("backgrounds only"),
          role: z.enum(["enter", "exit", "swap", "emphasis", "camera", "text"]).optional().describe("moves only"),
          energy: z.string().optional().describe('moves only: "3", "2-4", "<=3", ">=2"'),
          near: z.string().optional().describe('hex colors, comma-separated: "#0a0f1f,#eef1f8,#3d6bff"'),
          limit: z.number().int().min(1).max(50).optional().describe("default 20"),
        }),
      },
      async ({ query, limit, ...opts }) => {
        const items = find(getIndex().items, query ?? "", opts) as unknown[];
        return text({ count: items.length, items: items.slice(0, limit ?? 20) });
      },
    );

    server.registerTool(
      "resource",
      {
        title: "One resource, in full",
        description: "The complete record of a resource: params with ranges and defaults, install details, usage snippet, notes, related ids and (for moves and recipes) the file contents. Fetch it before writing `--set` values or a board option's `values`.",
        inputSchema: z.object({ id: z.string() }),
      },
      async ({ id }) => {
        const r = getResource(id);
        return r ? text(r) : fail(`no resource "${id}" (try search)`);
      },
    );

    server.registerTool(
      "recolor",
      {
        title: "A background in a palette",
        description: "The values that recolor a background into a palette: each of its colors keeps its tone and takes the nearest palette hue. Pass a registry palette id, or the brand's colors (ground, figure, muted, surface, accent, optional ramp). Use the result as `--set` values for `pamo add`, or as a board option's `values`.",
        inputSchema: z.object({
          background: z.string().describe("a background id"),
          palette: z.string().optional().describe("a palette id from the registry"),
          colors: z.record(z.string(), z.string()).optional().describe("or the brand's hex colors by role: { ground, figure, muted, surface, accent }"),
          ramp: z.array(z.string()).optional(),
        }),
      },
      async ({ background, palette, colors, ramp }) => {
        const bg = getResource(background);
        if (!bg || bg.type !== "background") return fail(`"${background}" is not a background`);
        let pal: Record<string, unknown> | null = null;
        if (palette) { const p = getResource(palette); if (!p || p.type !== "palette") return fail(`"${palette}" is not a palette`); pal = defaults(p) as Record<string, unknown>; }
        else if (colors) pal = { ...colors, ...(ramp ? { ramp } : {}) };
        if (!pal) return fail("pass a palette id or the brand's colors");
        const all = recolor(bg, pal) as Record<string, unknown>, base = defaults(bg) as Record<string, unknown>;
        const values = Object.fromEntries(Object.entries(all).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k])));
        const set = setArgs(bg, { ...base, ...values }) as string[];
        return text({ id: background, values, add: `npx paper-motion add ${background}${set.length ? ` ${set.join(" ")}` : ""}` });
      },
    );

    server.registerTool(
      "board",
      {
        title: "Propose options as a board",
        description: "Creates a live board (2–4 options the user opens in a browser, sees in their own look, tunes and chooses) and returns its short link. With `wait` true it also waits for the user's choice (up to `waitMinutes`, default 4) and returns the reply line, the same one the user could paste in the chat: `paper-motion: B · mesh-sage --set speed=0.8 (bg-1)`. One resource type per board; `kit` boards take whole kits per option.",
        inputSchema: z.object({
          title: z.string().describe("what the user is deciding, in their words"),
          ask: z.string().optional(),
          reply: z.string().optional().describe("your name for this decision, e.g. bg-1; it comes back in the reply line"),
          look: z.object({ palette: pick.optional(), font: pick.optional() }).optional().describe("the user's palette and font pair; backgrounds are recolored into the palette"),
          options: z.array(z.object({ label: z.enum(["A", "B", "C", "D"]), id: z.string().optional(), values: z.record(z.string(), z.unknown()).optional(), items: z.array(pick).optional().describe("kit boards: the whole kit"), note: z.string().optional() })).min(2).max(4),
          kind: z.enum(["resource", "kit"]).optional(),
          wait: z.boolean().optional(),
          waitMinutes: z.number().min(0.5).max(4.5).optional(),
        }),
      },
      async ({ title, ask, reply, look, options, kind, wait, waitMinutes }, ctx) => {
        const req = (ctx as { http?: { request?: Request } }).http?.request;
        const ip = req ? clientIp(req) : "mcp";
        if (!canStore()) return fail("boards are not enabled on this site yet; build the link with `pamo board --url` instead");
        if (!(await allow("boards", ip, 60, 3600))) return fail("too many boards from this address; try again in an hour");
        const board = { v: 1, kind: kind ?? (options.some((o) => o.items) ? "kit" : "resource"), title, ...(ask ? { ask } : {}), ...(reply ? { reply } : {}), ...(look ? { look } : {}), options };
        const json = JSON.stringify(board);
        if (json.length > MAX_PAYLOAD) return fail(`the board is ${json.length} bytes; the limit is ${MAX_PAYLOAD}`);
        const index = Object.fromEntries(getIndex().items.map((i) => [i.id, i]));
        const errs = validateBoard(board, index) as string[];
        if (errs.length) return fail(`board: ${errs.join("; ")}`);
        const id = newId();
        await getStore().set(boardKey(id), board, BOARD_TTL);
        const url = `${site()}/b/${id}`;
        if (!wait) return text({ id, url, next: "share the link with the user; call this tool again with wait, or ask them to paste the line the board gives them" });
        const until = Date.now() + (waitMinutes ?? 4) * 60 * 1000;
        while (Date.now() < until) {
          const c = await getStore().get<Choice>(choiceKey(id));
          if (c) return text({ id, url, choice: c });
          await new Promise((r) => setTimeout(r, 2000));
        }
        return text({ id, url, choice: null, next: "no choice yet: ask the user to open the link and paste the line, or call board_choice later" });
      },
    );

    server.registerTool(
      "board_choice",
      {
        title: "The choice made on a board",
        description: "Reads the choice the user made on a board created earlier (by id). Returns null while there is none.",
        inputSchema: z.object({ id: z.string() }),
      },
      async ({ id }) => text({ id, choice: (await getStore().get<Choice>(choiceKey(id))) ?? null }),
    );
  },
  { serverInfo: { name: "paper-motion", version: "0.2.3" } },
);

export { handler as GET, handler as POST };
