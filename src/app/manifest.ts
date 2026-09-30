import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Medical Aid Navigator',
    short_name: 'Nav',
    description:
      'Know what to ask before you use your medical aid. Educational only — not medical, broker, or claim advice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef1f2',
    theme_color: '#7a1425',
    lang: 'en-ZA',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
