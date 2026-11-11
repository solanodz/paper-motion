// The six stages of making a film, as the landing tells them: each leads with its name and one plain sentence;
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
    name: "Look",
    says: "It puts four looks on a board, a link you open where each one plays in your colors. You pick one.",
    cmd: `${npx} board --look brand --option sage --option slate --option clay --option ochre`,
    out: "you chose C, clay",
    caption: "A board: four looks for paper-motion, playing. The choice goes back to your agent.",
  },
  {
    name: "Structure",
    says: "The film is cut into beats, and each beat gets a ready-made block from the library.",
    cmd: `${npx} chain init paper-motion --parts marker-highlight,terminal-run,browser-frame,toast-stack,stat-row,text-mask`,
    out: "6 parts in pieces/paper-motion, structure approved",
    caption: "Six beats, each one a block from the library, as long as it needs to be.",
  },
  {
    name: "Parts",
    says: "Every part is rendered alone, in your look. Approve it, ask for a change, or rewrite its words.",
    cmd: `${npx} chain paper-motion --drafts`,
    out: "6 drafts on clay, 6 of 6 approved",
    caption: "The parts, rendered one by one in the look you chose.",
  },
  {
    name: "Assembly",
    says: "The parts are joined by their transitions and played through, so you judge the whole film.",
    cmd: `${npx} chain paper-motion --draft`,
    out: "6 parts joined by whips, assembly approved",
    caption: "The assembly: six parts joined by whips, played through.",
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
export const FX = ["", "cut", "wipe", "slices", "iris", "whip", "zoom-through"] as const;
export type Fx = (typeof FX)[number];
