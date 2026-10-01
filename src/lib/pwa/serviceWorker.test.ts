import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { serviceWorkerScript } from './serviceWorker';

function worker(version = 'release-2') {
  const handlers: Record<string, (event: Record<string, unknown>) => void> = {};
  const skipWaiting = vi.fn().mockResolvedValue(undefined);
  const claim = vi.fn().mockResolvedValue(undefined);
  const addAll = vi.fn().mockResolvedValue(undefined);
  const deleteCache = vi.fn().mockResolvedValue(true);
  const match = vi.fn().mockResolvedValue('offline page');
  const fetch = vi.fn().mockRejectedValue(new Error('offline'));
  runInNewContext(serviceWorkerScript(version), {
    self: { location: { origin: 'https://example.test' }, skipWaiting, clients: { claim }, addEventListener: (name: string, callback: typeof handlers[string]) => { handlers[name] = callback; } },
    caches: { open: vi.fn().mockResolvedValue({ addAll }), keys: vi.fn().mockResolvedValue(['man-shell-old', 'man-shell-release-2', 'another-app-cache']), delete: deleteCache, match },
    fetch, URL,
  });
  return { handlers, skipWaiting, claim, addAll, deleteCache, fetch, match };
}

describe('versioned service worker', () => {
  it('changes with every deployment and waits for explicit refresh approval', async () => {
    expect(serviceWorkerScript('a')).not.toEqual(serviceWorkerScript('b'));
    const sw = worker(); let installing: Promise<unknown> | undefined;
    sw.handlers.install({ waitUntil: (promise: Promise<unknown>) => { installing = promise; } });
    await installing;
    expect(sw.addAll).toHaveBeenCalledWith(['/', '/offline']);
    expect(sw.skipWaiting).not.toHaveBeenCalled();
    sw.handlers.message({ data: { type: 'unrelated' }, waitUntil: vi.fn() });
    expect(sw.skipWaiting).not.toHaveBeenCalled();
    sw.handlers.message({ data: { type: 'SKIP_WAITING' }, waitUntil: vi.fn() });
    expect(sw.skipWaiting).toHaveBeenCalledTimes(1);
  });
  it('removes only this app’s outdated caches and claims tabs after cleanup', async () => {
    const sw = worker(); let activating: Promise<unknown> | undefined;
    sw.handlers.activate({ waitUntil: (promise: Promise<unknown>) => { activating = promise; } });
    await activating;
    expect(sw.deleteCache.mock.calls).toEqual([['man-shell-old']]);
    expect(sw.claim).toHaveBeenCalledTimes(1);
  });
  it('never intercepts AI requests and uses the current cache for offline navigation', async () => {
    const sw = worker(); const respondWith = vi.fn();
    sw.handlers.fetch({ request: { mode: 'cors', url: 'https://example.test/api/concierge' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    sw.handlers.fetch({ request: { mode: 'navigate', url: 'https://example.test/man' }, respondWith });
    await respondWith.mock.calls[0][0];
    expect(sw.match.mock.calls[0][1]).toEqual({ cacheName: 'man-shell-release-2' });
  });
});
