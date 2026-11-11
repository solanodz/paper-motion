"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKit } from "@/lib/kit";
import { IconKit } from "./icons";

const NAV = [
  { href: "/library", label: "Library", short: "Library", match: ["/library", "/r/"] },
  { href: "/docs", label: "For agents", short: "Agents", match: ["/docs"] },
];

/** The header's cells: where you can go, the one you are on in paper, and the kit with how much it holds. */
export function HeaderNav() {
  const path = usePathname();
  const k = useKit();
  const kitOn = path.startsWith("/kit");
  return (
    <nav className="cells min-w-0 text-[13px]">
      {NAV.map((n) => {
        const on = n.match.some((m) => path.startsWith(m));
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`cell max-sm:px-2.5 ${on ? "cell-on" : ""}`}>
            <span className="sm:hidden">{n.short}</span><span className="max-sm:hidden">{n.label}</span>
          </Link>
        );
      })}
      <Link href="/kit" aria-current={kitOn ? "page" : undefined} className={`cell max-sm:px-2.5 ${kitOn ? "cell-on" : ""}`}>
        <IconKit size={15} />
        <span>Kit</span>
        <span className="font-mono text-[12px]">{k.items.length}</span>
      </Link>
    </nav>
  );
}
