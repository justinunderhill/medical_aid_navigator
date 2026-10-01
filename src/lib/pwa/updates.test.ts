import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchAppUpdates } from './updates';

let page: EventTarget & { visibilityState: string };
let browser: EventTarget;
let workers: EventTarget & { controller: object | null; register: ReturnType<typeof vi.fn> };
let registration: EventTarget & { waiting: { postMessage: ReturnType<typeof vi.fn> } | null; installing: null; update: ReturnType<typeof vi.fn> };
let fetchMock: ReturnType<typeof vi.fn>;
let online: { onLine: boolean; serviceWorker: typeof workers };
const monitors: ReturnType<typeof watchAppUpdates>[] = [];
async function settle() { for (let i = 0; i < 10; i++) await Promise.resolve(); }
function watch(version = 'old') {
  const onAvailable = vi.fn(); const onRefresh = vi.fn();
  const monitor = watchAppUpdates({ version, onAvailable, onRefresh });
  monitors.push(monitor);
  return { monitor, onAvailable, onRefresh };
}

beforeEach(() => {
  vi.useFakeTimers();
  page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  browser = new EventTarget();
  registration = Object.assign(new EventTarget(), { waiting: null, installing: null, update: vi.fn().mockResolvedValue(undefined) });
  workers = Object.assign(new EventTarget(), { controller: {}, register: vi.fn().mockResolvedValue(registration) });
  online = { onLine: true, serviceWorker: workers };
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: 'new' }) });
  vi.stubGlobal('document', page); vi.stubGlobal('window', browser);
  vi.stubGlobal('navigator', online); vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  monitors.splice(0).forEach(monitor => monitor.dispose());
  vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('PWA deployment updates', () => {
  it('detects a new deployment without reloading the active session', async () => {
    const { onAvailable, onRefresh } = watch(); await settle();
    expect(onAvailable).toHaveBeenCalledWith('new');
    expect(onRefresh).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].cache).toBe('no-store');
    expect(workers.register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  });
  it('does not prompt on first install or when the deployment is unchanged', async () => {
    workers.controller = null;
    const { onAvailable, onRefresh } = watch('new'); await settle();
    workers.dispatchEvent(new Event('controllerchange')); await settle();
    expect(onAvailable).not.toHaveBeenCalled(); expect(onRefresh).not.toHaveBeenCalled();
  });
  it('checks periodically and when the app returns to the foreground or reconnects', async () => {
    watch(); await settle(); fetchMock.mockClear();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    browser.dispatchEvent(new Event('focus')); await settle();
    page.dispatchEvent(new Event('visibilitychange')); await settle();
    browser.dispatchEvent(new Event('online')); await settle();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('ignores offline, hidden, failed and malformed version responses', async () => {
    online.onLine = false;
    const { onAvailable } = watch(); await settle(); expect(fetchMock).not.toHaveBeenCalled();
    online.onLine = true; page.visibilityState = 'hidden';
    browser.dispatchEvent(new Event('focus')); await settle(); expect(fetchMock).not.toHaveBeenCalled();
    page.visibilityState = 'visible'; fetchMock.mockRejectedValueOnce(new Error('offline'));
    browser.dispatchEvent(new Event('online')); await settle();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ version: null }) });
    browser.dispatchEvent(new Event('focus')); await settle();
    expect(onAvailable).not.toHaveBeenCalled();
  });
  it('activates a waiting worker only after acceptance, then reloads exactly once', async () => {
    registration.waiting = { postMessage: vi.fn() };
    const { monitor, onRefresh } = watch(); await settle();
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
    await monitor.apply();
    expect(registration.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    workers.dispatchEvent(new Event('controllerchange'));
    workers.dispatchEvent(new Event('controllerchange'));
    await vi.advanceTimersByTimeAsync(8000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
  it('preserves another open tab when a worker is activated elsewhere', async () => {
    const { onRefresh } = watch(); await settle();
    workers.dispatchEvent(new Event('controllerchange')); await settle();
    expect(onRefresh).not.toHaveBeenCalled();
  });
  it('allows refresh without a waiting worker but refuses to discard a session offline', async () => {
    const { monitor, onRefresh } = watch(); await settle();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(monitor.apply()).rejects.toThrow('offline');
    expect(onRefresh).not.toHaveBeenCalled();
    await monitor.apply(); expect(onRefresh).toHaveBeenCalledTimes(1);
  });
  it('cleans up listeners and scheduled refreshes when unmounted', async () => {
    registration.waiting = { postMessage: vi.fn() };
    const { monitor, onRefresh } = watch(); await settle(); await monitor.apply();
    monitor.dispose(); fetchMock.mockClear();
    browser.dispatchEvent(new Event('focus')); workers.dispatchEvent(new Event('controllerchange'));
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(fetchMock).not.toHaveBeenCalled(); expect(onRefresh).not.toHaveBeenCalled();
  });
});
