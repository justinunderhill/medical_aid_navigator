import Link from 'next/link';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Disclaimer } from '@/components/Disclaimer';

type FeedbackPageProps = {
  searchParams?: Promise<{
    scenario?: string | string[];
  }>;
};

function getScenarioParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const params = await searchParams;
  const initialScenarioId = getScenarioParam(params?.scenario);

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
      <FeedbackForm initialScenarioId={initialScenarioId} />
      <Disclaimer />
    </main>
  );
}
