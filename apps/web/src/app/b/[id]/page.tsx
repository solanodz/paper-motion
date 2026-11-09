import type { Metadata } from "next";
import { BoardView } from "../board-view";

export const metadata: Metadata = {
  title: "A board from your agent",
  description: "Your agent proposes 2–4 options. Open the board: they play live, in your look. Pick one, tune it if you like.",
  robots: { index: false },
  openGraph: { images: ["/site/og-board.png"], title: "Your agent proposes. You choose." },
};

/**
 * A short board link: the board is stored on the server under the id in the path. The page is static; the client
 * reads the id from the URL and fetches the board, so nothing here waits on params during the render.
 */
export default function ShortBoardPage() {
  return <BoardView short />;
}
