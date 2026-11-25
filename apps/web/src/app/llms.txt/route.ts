import { getEntries, runsLabel } from "@/lib/gallery";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** What this site is, for agents, and every video with the URL of its prompt. */
export function GET() {
  const entries = getEntries().filter((e) => !e.draft);
  const lines = [
    "# paper-motion",
    "",
    "> A gallery of videos made by coding agents. Each video comes with the exact prompt that made it, verified in a fresh session. Fetch a prompt, fill in its variables, and follow it: it carries its own timings, materials, checks and a director's pass (a blind critic and a revision).",
    "",
    "How to use a prompt:",
    "- Fetch it as plain text from the URL below. Its defaults are filled in; the entry page lists the variables to change.",
    "- Run it in the folder where the video should go. It renders from code (an HTML/canvas page captured with headless Chrome, encoded with ffmpeg).",
    "- Follow the checks and the director's pass at the end before you call it done.",
    "",
    "## Videos",
    "",
    ...entries.map(
      (e) =>
        `- [${e.title}](${SITE}/v/${e.slug}/prompt.md): ${e.summary} ${e.format}, ${e.duration} s. Techniques: ${e.techniques.join(", ")}. Verified: ${runsLabel(e)} with ${e.runs.agent} (${e.runs.model}), ${e.runs.date}.`,
    ),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
