"use client";

import { useEffect, useRef } from "react";

/**
 * Arms its children's entrances (words that rise, paper wipes: see globals.css) and plays them the first time it comes
 * on screen. Without JavaScript, or for people who asked for less motion, nothing is armed and everything just shows.
 */
export function InView({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.dataset.in = "";
      io.disconnect();
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref as React.RefObject<HTMLDivElement & HTMLElement>} className={className}>{children}</Tag>;
}

/** Its children drift a little with the pointer (set as --px and --py, from -1 to 1), so stacked things show depth. */
export function Parallax({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
