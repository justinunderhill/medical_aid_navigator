'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { watchAppUpdates } from '@/lib/pwa/updates';

/** Checks for new deployments and refreshes only after the user's choice. */
export function ServiceWorkerRegister() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const monitor = useRef<ReturnType<typeof watchAppUpdates>>();
  const laterTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    let lastVersion = '';
    monitor.current = watchAppUpdates({
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
      onAvailable: version => {
        setAvailable(true);
        if (version !== lastVersion) { lastVersion = version; setDismissed(false); }
      },
      onRefresh: () => window.location.reload(),
    });
    return () => { monitor.current?.dispose(); clearTimeout(laterTimer.current); };
  }, []);

  async function apply() {
    setRefreshing(true); setError('');
    try { await monitor.current?.apply(); }
    catch { setRefreshing(false); setError('Could not refresh right now. Check your connection and try again.'); }
  }
  if (!available || dismissed) return null;
  return <aside className="update-prompt" role="status" aria-label="App update available">
    <RefreshCw size={22} aria-hidden className={refreshing ? 'spin' : undefined} />
    <div className="update-prompt-copy"><strong>A new version is ready</strong>
      <p>Refresh to get the latest improvements. Your current chat, attached plan and unfinished checks will be cleared.</p>
      {error && <p className="update-error" role="alert">{error}</p>}
    </div>
    <div className="update-prompt-actions">
      <button className="btn btn-secondary" type="button" disabled={refreshing} onClick={() => {
        setDismissed(true);
        clearTimeout(laterTimer.current);
        laterTimer.current = setTimeout(() => setDismissed(false), 15 * 60 * 1000);
      }}>Later</button>
      <button className="btn btn-primary" type="button" disabled={refreshing} onClick={() => void apply()}>{refreshing ? 'Refreshing…' : 'Refresh now'}</button>
    </div>
  </aside>;
}
