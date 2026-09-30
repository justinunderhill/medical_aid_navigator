import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon — same glyph as icon.tsx, iOS's expected size. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(155deg, #9e2036 0%, #4e0d18 100%)',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id="mn-silver-apple" x1="10.5" y1="9.5" x2="29.5" y2="30.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e4e7e9" />
              <stop offset="1" stopColor="#9aa4ab" />
            </linearGradient>
          </defs>
          <path d="M20 9.5 L29.5 30.5 L20 25.4 L10.5 30.5 Z" fill="url(#mn-silver-apple)" />
          <path d="M20 9.5 L29.5 30.5 L20 25.4 Z" fill="#c23a52" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
