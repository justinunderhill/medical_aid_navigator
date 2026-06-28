'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';

const FEEDBACK_PRIVACY_NOTE =
  'Please DO NOT enter your ID number, medical aid member number, full address, or highly sensitive clinical details. A general description is enough.';

function FeedbackForm() {
  const params = useSearchParams();
  const initialScenarioId = params.get('scenario') ?? '';

  const [wasUseful, setWasUseful] = useState<boolean | null>(null);
  const [scenarioId, setScenarioId] = useState(initialScenarioId);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wasUseful, scenarioId, comment, email }),
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
        <label htmlFor="scenario">Scenario</label>
        <p className="field-privacy-note">{FEEDBACK_PRIVACY_NOTE}</p>
        <input
          id="scenario"
          type="text"
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          placeholder="e.g. casualty, planned-procedure, claim-rejection"
        />
      </div>

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <label htmlFor="comment">Comment</label>
        <p className="field-privacy-note">{FEEDBACK_PRIVACY_NOTE}</p>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What worked, what was confusing, or what should improve?"
        />
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
          Email is optional and used only to follow up on your feedback.
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
        Was this useful? Help improve the MVP.
      </h1>
      <p className="muted" style={{ marginBottom: 'var(--sp-6)' }}>
        No login required. Feedback is optional and anonymous unless you choose to provide an email.
      </p>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <FeedbackForm />
      </Suspense>
      <Disclaimer />
    </main>
  );
}
