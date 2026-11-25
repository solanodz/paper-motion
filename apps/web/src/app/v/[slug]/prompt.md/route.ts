import { fullPrompt, getDirector, getEntries, getEntry } from "@/lib/gallery";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getEntries().map((e) => ({ slug: e.slug }));
}

/** The prompt as plain text, defaults filled in and the director's pass appended: what an agent fetches. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const e = getEntry((await ctx.params).slug);
  if (!e) return new Response("Not found\n", { status: 404 });
  return new Response(fullPrompt(e, getDirector()), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
