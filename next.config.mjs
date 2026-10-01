import { existsSync, readFileSync } from 'node:fs';

export default function config() {
  // All build workers and server restarts must use the same persisted version.
  // npm's prebuild hook rotates it once per local build; Vercel supplies its own.
  const versionFile = new URL('./.app-build-version', import.meta.url);
  const appVersion = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA ||
    (existsSync(versionFile) ? readFileSync(versionFile, 'utf8').trim() : 'development');
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    env: { NEXT_PUBLIC_APP_VERSION: appVersion },
    generateBuildId: async () => appVersion,
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          ],
        },
      ];
    },
  };
  return nextConfig;
}
