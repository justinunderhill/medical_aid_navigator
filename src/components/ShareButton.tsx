'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

const SHARE_TITLE = 'Medical Aid Navigator';
const SHARE_TEXT =
  'A free tool to help South African medical aid members know what to ask, check, and document.';
const FALLBACK_URL = 'https://medical-aid-navigator.vercel.app/';

function currentShareUrl() {
  if (typeof window === 'undefined') return FALLBACK_URL;
  return window.location.href || FALLBACK_URL;
}

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = currentShareUrl();

  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${SHARE_TEXT} ${url}`);
    const encodedTitle = encodeURIComponent(SHARE_TITLE);

    return [
      {
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodedText}`,
      },
      {
        label: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      },
      {
        label: 'X',
        href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      },
      {
        label: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
      },
    ];
  }, [url]);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch {
        // If the user cancels or native sharing is unavailable, keep the menu usable.
      }
    }
    setOpen((value) => !value);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="share-menu">
      <button
        type="button"
        className="share-trigger"
        aria-expanded={open}
        aria-controls="share-options"
        onClick={share}
      >
        <Share2 size={16} />
        Share
      </button>

      {open && (
        <div id="share-options" className="share-panel">
          <p className="share-panel-title">Share this page</p>
          <div className="share-links">
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
          <button type="button" className="share-copy" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied link' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
