import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * Generates the PWA/app icon at request time from the same garnet gradient +
 * brushed-silver cursor glyph as BrandMark.tsx, so the installed icon and the
 * in-app mark match exactly.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(155deg, #9e2036 0%, #4e0d18 100%)',
        }}
      >
        {/* Full-bleed square, glyph inset within the maskable-icon safe zone. */}
        <svg width="320" height="320" viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id="mn-silver" x1="10.5" y1="9.5" x2="29.5" y2="30.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e4e7e9" />
              <stop offset="1" stopColor="#9aa4ab" />
            </linearGradient>
          </defs>
          <path d="M20 9.5 L29.5 30.5 L20 25.4 L10.5 30.5 Z" fill="url(#mn-silver)" />
          <path d="M20 9.5 L29.5 30.5 L20 25.4 Z" fill="#c23a52" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
