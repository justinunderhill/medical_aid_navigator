'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'man-install-dismissed';

/**
 * Custom "add to home screen" sheet. Only appears where the browser fires
 * beforeinstallprompt (Chromium/Android) — iOS Safari never fires this event,
 * so the prompt simply never shows there, which is expected, not a bug.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISSED_KEY) === '1');
    } catch {
      setDismissed(false);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const onFocus = () => setEditing(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ?? false);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onFocus);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onFocus);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setDeferred(null);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* best-effort only */
    }
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // Installation is optional; an unsupported/dismissed prompt must not break the app.
    } finally {
      setDeferred(null);
    }
  };

  if (!deferred || dismissed || editing) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label="Add to home screen">
      <BrandMark size={40} className="install-prompt-badge" />
      <div className="install-prompt-copy">
        <strong>Add Medical Aid Navigator</strong>
        <span>to your home screen</span>
      </div>
      <button className="btn btn-secondary install-prompt-dismiss" onClick={dismiss} aria-label="Not now">
        <X size={16} />
      </button>
      <button className="btn btn-primary install-prompt-install" onClick={install}>
        <Download size={16} /> Add
      </button>
    </div>
  );
}
