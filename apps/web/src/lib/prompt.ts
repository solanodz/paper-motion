/** The one sentence a user gives their agent to start a video. Shown on the home page and in the docs. */
export const starterPrompt = (site: string) =>
  `Use ${site.replace(/^https?:\/\//, "")} to make a video for my brand. Read ${site}/llms.txt first, interview me, then let me decide each step in the paper-motion studio and on board links I can open.`;
