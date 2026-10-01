const CHECK_INTERVAL = 5 * 60 * 1000;

/** Detect deployments even when a release changes no service-worker logic. */
export function watchAppUpdates(options: {
  version: string;
  onAvailable: (version: string) => void;
  onRefresh: () => void;
}) {
  let disposed = false;
  let checking = false;
  let accepted = false;
  let refreshed = false;
  let registration: ServiceWorkerRegistration | undefined;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  const workerCleanups: (() => void)[] = [];

  const refresh = () => {
    if (disposed || refreshed || !accepted) return;
    refreshed = true;
    options.onRefresh();
  };
  async function readVersion() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/version', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Version unavailable');
      const data = await response.json();
      if (typeof data.version !== 'string' || !data.version) throw new Error('Invalid version');
      return data.version as string;
    } finally { clearTimeout(timer); }
  }
  async function check() {
    if (disposed || checking || document.visibilityState !== 'visible' || !navigator.onLine) return;
    checking = true;
    try {
      const version = await readVersion();
      if (!disposed && version !== options.version) options.onAvailable(version);
    } catch { /* Offline/temporary failures must not trigger a refresh prompt. */ }
    finally { checking = false; }
    if (!disposed) void registration?.update().catch(() => {});
  }
  const inspectWorker = () => {
    if (registration?.waiting && navigator.serviceWorker.controller) void check();
    const worker = registration?.installing;
    if (!worker) return;
    const onState = () => { if (worker.state === 'installed') void check(); };
    worker.addEventListener('statechange', onState);
    workerCleanups.push(() => worker.removeEventListener('statechange', onState));
  };
  const onControllerChange = () => {
    // Another tab may activate the update. Preserve this tab unless it opted in.
    if (accepted) refresh();
    else void check();
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(value => {
      if (disposed) return;
      registration = value;
      value.addEventListener('updatefound', inspectWorker);
      inspectWorker();
      void value.update().catch(() => {});
    }).catch(() => { /* Version checks still work if service workers are unavailable. */ });
  }
  window.addEventListener('focus', check);
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
  const interval = setInterval(check, CHECK_INTERVAL);
  void check();

  return {
    async apply() {
      if (disposed || accepted) return;
      // Confirm connectivity before discarding the in-memory session.
      await readVersion();
      if (disposed) return;
      accepted = true;
      const waiting = registration?.waiting;
      if (waiting) {
        try {
          waiting.postMessage({ type: 'SKIP_WAITING' });
          // Refresh also works if a browser doesn't emit controllerchange.
          reloadTimer = setTimeout(refresh, 8000);
        } catch { refresh(); }
      } else refresh();
    },
    dispose() {
      disposed = true;
      clearInterval(interval);
      clearTimeout(reloadTimer);
      window.removeEventListener('focus', check);
      window.removeEventListener('online', check);
      document.removeEventListener('visibilitychange', check);
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', inspectWorker);
      workerCleanups.forEach(cleanup => cleanup());
    },
  };
}
