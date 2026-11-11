"use client";

import Link from "next/link";
import { useKit } from "@/lib/kit";
import { IconKit } from "./icons";

/** The kit as a cell: always one click away, with how many resources it holds. */
export function KitNavLink() {
  const k = useKit();
  return (
    <Link href="/kit" className="cell">
      <IconKit size={15} />
      <span>Kit</span>
      <span className="font-mono text-[12px]">{k.items.length}</span>
    </Link>
  );
}
