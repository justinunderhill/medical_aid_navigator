/**
 * The Medical Aid Navigator mark — a two-tone navigation cursor on a garnet
 * gradient, with a brushed-silver facet standing in for the old mint one.
 * Reads as "navigate / find your way", tying to the product name.
 * Decorative (aria-hidden); the wordmark text carries the accessible name.
 */
export function BrandMark({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden style={{ display: 'inline-flex' }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img">
        <defs>
          <linearGradient id="mn-bg" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9e2036" />
            <stop offset="1" stopColor="#4e0d18" />
          </linearGradient>
          <linearGradient id="mn-silver" x1="10.5" y1="9.5" x2="29.5" y2="30.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e4e7e9" />
            <stop offset="1" stopColor="#9aa4ab" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#mn-bg)" />
        {/* navigation cursor — left facet brushed silver, right facet garnet highlight */}
        <path d="M20 9.5 L29.5 30.5 L20 25.4 L10.5 30.5 Z" fill="url(#mn-silver)" />
        <path d="M20 9.5 L29.5 30.5 L20 25.4 Z" fill="#c23a52" />
      </svg>
    </span>
  );
}
