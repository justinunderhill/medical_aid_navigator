'use client';

import { useEffect } from 'react';

/** Registers the app-shell service worker. No UI; safe to mount once. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support degrades silently — the app still works online */
    });
  }, []);

  return null;
}
