import { serviceWorkerScript } from '@/lib/pwa/serviceWorker';

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(serviceWorkerScript(process.env.NEXT_PUBLIC_APP_VERSION ?? 'development'), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Service-Worker-Allowed': '/',
    },
  });
}
