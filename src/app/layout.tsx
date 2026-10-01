import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ManProvider } from '@/components/ManConcierge';
import { AppShell } from '@/components/AppShell';

/**
 * Fonts are loaded with next/font (self-optimised, no render-blocking @import,
 * no layout shift). These expose CSS variables consumed by tokens.css:
 *   --font-fraunces  → display/headings (warm serif — the design's signature)
 *   --font-inter     → body / UI
 *   --font-plex-mono → codes, eyebrow labels, data
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz'],
});
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: 'Medical Aid Navigator — Know what to ask before you use your medical aid',
  description:
    'A free, educational tool that helps South African medical aid members understand what to ask, check, and document before, during, and after using their benefits. Not medical, broker, or claim advice.',
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nav',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#7a1425',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-ZA"
      className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
    >
      <body>
        <ManProvider>
        <AppShell>
        <SiteHeader />
        <ServiceWorkerRegister />
        {children}
        <SiteFooter />
        <MobileNav />
        <InstallPrompt />
        </AppShell>
        </ManProvider>
      </body>
    </html>
  );
}
