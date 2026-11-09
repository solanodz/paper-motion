import { NextResponse } from "next/server";
import { validateBoard, MAX_PAYLOAD } from "@/lib/board.mjs";
import { getIndex } from "@/lib/registry";
import { allow, BOARD_TTL, boardKey, canStore, clientIp, getStore, newId } from "@/lib/store";


/**
 * POST { board } → { id, url }: stores a board under an unguessable id for 90 days. The agent's CLI (and the MCP)
 * call this to get a short link; the fragment link keeps working without it.
 */
export async function POST(req: Request) {
  if (!canStore()) return NextResponse.json({ error: "short links are not enabled on this site yet" }, { status: 503 });
  if (!(await allow("boards", clientIp(req), 60, 3600))) return NextResponse.json({ error: "too many boards from this address; try again in an hour" }, { status: 429 });
  let body: { board?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "a JSON body with { board } is required" }, { status: 400 }); }
  const board = body?.board;
  const json = JSON.stringify(board ?? null);
  if (json.length > MAX_PAYLOAD) return NextResponse.json({ error: `the board is ${json.length} bytes of JSON; the limit is ${MAX_PAYLOAD}` }, { status: 413 });
  const index = Object.fromEntries(getIndex().items.map((i) => [i.id, i]));
  const errs = validateBoard(board, index) as string[];
  if (errs.length) return NextResponse.json({ error: errs.join("; ") }, { status: 400 });
  const id = newId();
  await getStore().set(boardKey(id), board, BOARD_TTL);
  const site = (process.env.PAPER_MOTION_SITE ?? new URL(req.url).origin).replace(/\/$/, "");
  return NextResponse.json({ id, url: `${site}/b/${id}`, expires: new Date(Date.now() + BOARD_TTL * 1000).toISOString() }, { status: 201 });
}
