import type { Metadata } from "next";
import { BoardView } from "./board-view";

export const metadata: Metadata = { title: "A board from your agent", robots: { index: false } };

/** A live board: the options travel in the URL fragment, so this page is static and reads them in the browser. */
export default function BoardPage() {
  return <BoardView />;
}
