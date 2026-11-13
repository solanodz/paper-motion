// The four steps of making a film, as the landing tells them (the studio's own four, on one page): each leads with its name and one plain sentence;
// the command it runs is the footnote. Shared by the page and the pinned section.

export type Stage = { name: string; says: string; cmd: string; out: string; caption: string };

const npx = "npx paper-motion";

export const STAGES: Stage[] = [
  {
    name: "What you say",
    says: "Your agent reads your site and your files and lists what the film can really show. You keep what is true, and fix any word.",
    cmd: `${npx} inventory paper-motion --from https://paper-motion.vercel.app --from README.md`,
    out: "7 proposals, 6 kept",
    caption: "What the film can show, in plain words: a sentence, a command, a screen, three numbers.",
  },
  {
    name: "How it looks",
    says: "Colours, type, background and movement, each playing with your own sentence. Your agent suggests; you choose by watching.",
    cmd: `${npx} board --url --title "Looks" --option sage-night --option slate-sea --option clay-desert --option ochre-sun`,
    out: "in the studio, How it looks · you chose C, clay",
    caption: "The brand's looks, cut one after another under paper-motion until one stays: clay. The choice goes back to your agent.",
  },
  {
    name: "Your video",
    says: "The studio builds the first cut from what you kept. You change any word, background, transition or speed yourself, scene by scene.",
    cmd: `${npx} piece listen paper-motion`,
    out: "6 scenes from the library, edited by you, approved",
    caption: "Your video in the studio: six scenes from the library, filled with your content.",
  },
  {
    name: "Export",
    says: "Every frame is rendered on your machine. The film, and the scenes behind it, are files you own.",
    cmd: `${npx} chain paper-motion --motion-blur 5`,
    out: "renders/paper-motion.mp4, 1920×1080, 30 s, every frame rendered",
    caption: "pieces/paper-motion/renders/paper-motion.mp4: six library blocks, rendered by the engine.",
  },
];

/** The library transition that brings each stage onto the monitor (index 0 is the opening film). */
export const FX = ["", "cut", "slices", "whip", "zoom-through"] as const;
export type Fx = (typeof FX)[number];
