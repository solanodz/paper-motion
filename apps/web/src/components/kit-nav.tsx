"use client";

import Link from "next/link";
import { useKit } from "@/lib/kit";
import { IconKit } from "./icons";

/** The kit in the header: always one click away, with how many resources it holds. */
export function KitNavLink() {
  const k = useKit();
  return (
    <Link href="/kit" className="flex items-center gap-1.5 rounded-full border border-line py-1 pl-2.5 pr-2 text-figure transition-colors hover:border-faint">
      <IconKit size={14} className="text-paper" />
      <span>Kit</span>
      <span className={`min-w-[18px] rounded-full px-1 text-center text-[10.5px] leading-[17px] ${k.items.length ? "bg-paper text-ground" : "bg-raised text-faint"}`}>{k.items.length}</span>
    </Link>
  );
}
