'use client';

import { useState } from 'react';
import Link from 'next/link';

const FEEDBACK_PRIVACY_NOTE =
  'Please do not include your ID number, medical aid member number, full address, or detailed clinical records in your feedback.';

type UsefulValue = 'yes' | 'no' | 'unsure';

export function FeedbackForm({ initialScenarioId = '' }: { initialScenarioId?: string }) {
  const [useful, setUseful] = useState<UsefulValue | null>(null);
  const [situation, setSituation] = useState(initialScenarioId);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useful,
          situation,
          comment,
          email,
          createdAt: new Date().toISOString(),
        }),
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
          Your feedback shapes what we improve next. <Link href="/">Back to home</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="feedback-form">
      <div className="feedback-field">
        <label>Was this useful?</label>
        <div className="chip-group">
          <button className="chip" aria-pressed={useful === 'yes'} onClick={() => setUseful('yes')}>
            Yes
          </button>
          <button className="chip" aria-pressed={useful === 'no'} onClick={() => setUseful('no')}>
            No
          </button>
          <button className="chip" aria-pressed={useful === 'unsure'} onClick={() => setUseful('unsure')}>
            Unsure
          </button>
        </div>
      </div>

      <div className="feedback-field">
        <label htmlFor="feedback-situation">Which situation were you trying to understand?</label>
        <input
          id="feedback-situation"
          type="text"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="Optional, e.g. casualty, PMB, chronic cover"
        />
      </div>

      <div className="feedback-field">
        <label htmlFor="feedback-comment">What should be improved or added?</label>
        <textarea
          id="feedback-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What confused you, what helped, or what should be added next?"
        />
      </div>

      <div className="feedback-field">
        <label htmlFor="feedback-email">Optional email address</label>
        <input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Only if you'd like a reply"
        />
      </div>

      <p className="field-privacy-note">{FEEDBACK_PRIVACY_NOTE}</p>

      <button className="btn btn-primary" onClick={submit} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>

      {status === 'error' && (
        <p className="small" style={{ color: 'var(--alert)', marginTop: 'var(--sp-3)' }}>
          That didn’t go through. Please try again in a moment.
        </p>
      )}
    </div>
  );
}
