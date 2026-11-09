import { NextResponse } from "next/server";
import { boardKey, choiceKey, getStore, isId } from "@/lib/store";


/** GET → the stored board (404 once it expired or was forgotten). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "not a board id" }, { status: 400 });
  const board = await getStore().get(boardKey(id));
  if (!board) return NextResponse.json({ error: "no board with that id (boards expire after 90 days)" }, { status: 404 });
  return NextResponse.json({ id, board }, { headers: { "cache-control": "no-store" } });
}

/** DELETE → forgets the board and its choice (`pamo board --forget <id>`). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "not a board id" }, { status: 400 });
  await Promise.all([getStore().del(boardKey(id)), getStore().del(choiceKey(id))]);
  return new NextResponse(null, { status: 204 });
}
