import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BoardView } from "../board-view";
import { isId } from "@/lib/store";

export const metadata: Metadata = {
  title: "A board from your agent",
  description: "Your agent proposes 2–4 options. Open the board: they play live, in your look. Pick one, tune it if you like.",
  robots: { index: false },
  openGraph: { images: ["/site/og-board.png"], title: "Your agent proposes. You choose." },
};

async function ShortBoard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) notFound();
  return <BoardView id={id} />;
}

/** A short board link: the board is stored on the server under this id and read in the browser. */
export default function ShortBoardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center font-mono text-[13px] text-faint">Opening the board…</div>}>
      <ShortBoard params={params} />
    </Suspense>
  );
}
