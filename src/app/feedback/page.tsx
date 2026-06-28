'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Disclaimer } from '@/components/Disclaimer';

function FeedbackPageForm() {
  const params = useSearchParams();
  return <FeedbackForm initialScenarioId={params.get('scenario') ?? ''} />;
}

export default function FeedbackPage() {
  return (
    <main className="shell">
      <Link href="/" className="link-quiet" style={{ marginBottom: 'var(--sp-4)', display: 'inline-block' }}>
        ← Home
      </Link>
      <p className="eyebrow">Feedback</p>
      <h1 className="h-display" style={{ marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        Help improve this MVP
      </h1>
      <p className="muted" style={{ marginBottom: 'var(--sp-6)' }}>
        Was this useful? Tell me what confused you about your medical aid, what this tool helped with, or what should be added next.
      </p>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <FeedbackPageForm />
      </Suspense>
      <Disclaimer />
    </main>
  );
}
