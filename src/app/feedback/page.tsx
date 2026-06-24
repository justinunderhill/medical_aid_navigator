'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';

function FeedbackForm() {
  const params = useSearchParams();
  const scenarioId = params.get('scenario') ?? '';

  const [wasUseful, setWasUseful] = useState<boolean | null>(null);
  const [unclear, setUnclear] = useState('');
  const [wishlist, setWishlist] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wasUseful, scenarioId, unclear, wishlist, email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="callout">
        <strong>Thanks — that helps.</strong>
        <p style={{ margin: '4px 0 0' }}>
          Your feedback shapes what we build next.{' '}
          <Link href="/">Back to home</Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <label>Was this useful?</label>
        <div className="chip-group">
          <button className="chip" aria-pressed={wasUseful === true} onClick={() => setWasUseful(true)}>
            Yes
          </button>
          <button className="chip" aria-pressed={wasUseful === false} onClick={() => setWasUseful(false)}>
            Not really
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <label htmlFor="unclear">Was anything unclear?</label>
        <textarea id="unclear" rows={3} value={unclear} onChange={(e) => setUnclear(e.target.value)} />
      </div>

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <label htmlFor="wishlist">What would you want added?</label>
        <textarea id="wishlist" rows={3} value={wishlist} onChange={(e) => setWishlist(e.target.value)} />
      </div>

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <label htmlFor="email">Email (optional)</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Only if you'd like a reply"
        />
        <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>
          We never ask for your ID or membership number. Email is optional and used only to follow up.
        </p>
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>

      {status === 'error' && (
        <p className="small" style={{ color: 'var(--alert)', marginTop: 'var(--sp-3)' }}>
          That didn’t go through. Please try again in a moment.
        </p>
      )}
    </>
  );
}

export default function FeedbackPage() {
  return (
    <main className="shell">
      <Link href="/" className="link-quiet" style={{ marginBottom: 'var(--sp-4)', display: 'inline-block' }}>
        ← Home
      </Link>
      <p className="eyebrow">Feedback</p>
      <h1 className="h-display" style={{ marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        Help us make this more useful.
      </h1>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <FeedbackForm />
      </Suspense>
      <Disclaimer />
    </main>
  );
}
