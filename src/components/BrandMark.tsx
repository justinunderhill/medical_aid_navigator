/**
 * The Medical Aid Navigator mark — a two-tone navigation cursor on a deep pine
 * gradient. Reads as "navigate / find your way", tying to the product name.
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
            <stop stopColor="#1b4f48" />
            <stop offset="1" stopColor="#0c2a27" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#mn-bg)" />
        {/* navigation cursor — left facet white, right facet mint */}
        <path d="M20 9.5 L29.5 30.5 L20 25.4 L10.5 30.5 Z" fill="#f4f1ea" />
        <path d="M20 9.5 L29.5 30.5 L20 25.4 Z" fill="#2fbd83" />
      </svg>
    </span>
  );
}
