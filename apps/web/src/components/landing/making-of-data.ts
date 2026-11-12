// The four stages of making a film, as the landing tells them: each leads with its name and one plain sentence;
// the command it runs is the footnote. Shared by the page and the pinned section.

export type Stage = { name: string; says: string; cmd: string; out: string; caption: string };

const npx = "npx paper-motion";

export const STAGES: Stage[] = [
  {
    name: "Brief",
    says: "Your agent asks what the film says, to whom and for how long, and writes it down. You can fix any word by hand.",
    cmd: `${npx} piece init paper-motion --title "paper-motion" --format "16:9, 30 s"`,
    out: "studio on 127.0.0.1:4317, brief approved",
    caption: "The brief, in the studio that runs on your machine.",
  },
  {
    name: "Content",
    says: "It reads your site and your files and lists what the film can really show. You keep what is true, and fix any word.",
    cmd: `${npx} inventory paper-motion --from https://paper-motion.vercel.app --from README.md`,
    out: "7 proposals, 6 kept",
    caption: "What the film can show, in plain words: a sentence, a command, a screen, three numbers.",
  },
  {
    name: "Video",
    says: "The studio builds the first cut from what you kept. You change any word, background, transition or length yourself, and watch it play.",
    cmd: `${npx} piece review paper-motion video`,
    out: "6 parts from the library, edited by you, approved",
    caption: "Your video in the studio: six parts from the library, filled with your content.",
  },
  {
    name: "Final",
    says: "Every frame is rendered on your machine. The film, and the scenes behind it, are files you own.",
    cmd: `${npx} chain paper-motion --motion-blur 5`,
    out: "renders/paper-motion.mp4, 1920×1080, 31.2 s, every frame rendered",
    caption: "pieces/paper-motion/renders/paper-motion.mp4: six library blocks, rendered by the engine.",
  },
];

/** The library transition that brings each stage onto the monitor (index 0 is the opening film). */
export const FX = ["", "cut", "slices", "whip", "zoom-through"] as const;
export type Fx = (typeof FX)[number];
