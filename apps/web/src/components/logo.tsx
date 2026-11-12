// paper-motion's mark: Capas, three sheets stacked on a diagonal. Each sheet's outline cuts through the ones around it,
// which leaves nested L's and a small square inside the front sheet. Drawn as plain paths so it needs no ids.
// Model: 28-wide squares offset by 9, cut by 3-wide outlines (the L's are 6 thick, the square 16).
const MARK =
  "M6 6H34V13.5H13.5V34H6Z M16.5 16.5H41.5V22.5H22.5V41.5H16.5Z M25.5 25.5H41.5V41.5H25.5Z M44.5 25.5H50.5V50.5H25.5V44.5H44.5Z";

export function LogoMark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="6 6 44.5 44.5" width={size} height={size} className={className} aria-hidden>
      <path d={MARK} fill="currentColor" />
    </svg>
  );
}
