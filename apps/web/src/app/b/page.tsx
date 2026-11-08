import type { Metadata } from "next";
import { BoardView } from "./board-view";

export const metadata: Metadata = {
  title: "A board from your agent",
  description: "Your agent proposes 2–4 options. Open the board: they play live, in your look. Pick one, tune it if you like, paste one line back.",
  robots: { index: false },
  openGraph: { images: ["/site/og-board.png"], title: "Your agent proposes. You choose." },
};

/** A live board: the options travel in the URL fragment, so this page is static and reads them in the browser. */
export default function BoardPage() {
  return <BoardView />;
}
