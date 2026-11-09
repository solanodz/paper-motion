import { NextResponse } from "next/server";
import { allow, BOARD_TTL, boardKey, type Choice, choiceKey, clientIp, getStore, isId } from "@/lib/store";


/** GET → the choice made on this board, or 204 while there is none. `pamo board --wait` polls this. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "not a board id" }, { status: 400 });
  const c = await getStore().get<Choice>(choiceKey(id));
  if (!c) return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  return NextResponse.json(c, { headers: { "cache-control": "no-store" } });
}

/** POST { line, label?, none?, text? } → stores the user's choice. The last one wins while the board lives. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "not a board id" }, { status: 400 });
  if (!(await allow("choices", clientIp(req), 120, 3600))) return NextResponse.json({ error: "too many choices from this address" }, { status: 429 });
  if (!(await getStore().get(boardKey(id)))) return NextResponse.json({ error: "no board with that id" }, { status: 404 });
  let body: Partial<Choice>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "a JSON body is required" }, { status: 400 }); }
  if (typeof body.line !== "string" || body.line.length > 2000) return NextResponse.json({ error: "line (the reply line) is required" }, { status: 400 });
  const labels = Array.isArray(body.labels) ? body.labels.map((l) => String(l).slice(0, 1)).slice(0, 4) : undefined;
  const choice: Choice = { line: body.line, at: Date.now(), ...(body.label ? { label: String(body.label).slice(0, 1) } : {}), ...(labels?.length ? { labels } : {}), ...(body.none ? { none: true } : {}), ...(body.text ? { text: String(body.text).slice(0, 500) } : {}) };
  await getStore().set(choiceKey(id), choice, BOARD_TTL);
  return NextResponse.json(choice, { status: 201 });
}
