import Link from 'next/link';
import { ArrowLeft, BookOpen, PlugZap, ShieldQuestion } from 'lucide-react';
import { Disclaimer } from '@/components/Disclaimer';

const sourceNotes = [
  {
    title: 'Public education resources',
    body:
      'The MVP is grounded in public medical aid education resources, including Council for Medical Schemes guidance and public scheme documents.',
    icon: BookOpen,
  },
  {
    title: 'No live scheme integration',
    body:
      'The tool is not connected to any scheme system and does not read your personal policy, claims, authorisations, or balances.',
    icon: PlugZap,
  },
  {
    title: 'Confirmation still matters',
    body:
      'It cannot confirm personal benefits, available balances, authorisation status, claim outcomes, or whether a provider is in network for your plan.',
    icon: ShieldQuestion,
  },
];

export default function SourcesPage() {
  return (
    <main className="desk-shell sources-page">
      <Link href="/" className="link-quiet sources-back">
        <ArrowLeft size={16} /> Home
      </Link>

      <header className="sources-hero">
        <div>
          <p className="eyebrow">Sources &amp; limitations</p>
          <h1>What the MVP is grounded in, and what it cannot know</h1>
          <p className="sources-lead">
            This tool is designed for medical aid literacy and navigation. It helps
            you prepare better questions; it does not replace direct confirmation
            from your scheme, provider, or accredited broker.
          </p>
        </div>
        <div className="sources-review">Last reviewed: June 2026</div>
      </header>

      <section className="sources-grid" aria-label="Source and limitation notes">
        {sourceNotes.map(({ title, body, icon: Icon }) => (
          <article key={title} className="sources-card">
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="sources-panel" aria-labelledby="limits-title">
        <p className="eyebrow">Important limits</p>
        <h2 id="limits-title">Always confirm your own position</h2>
        <ul className="sources-list">
          <li>No diagnosis or treatment advice.</li>
          <li>No claim guarantee or prediction.</li>
          <li>No scheme switching, broker, legal, or financial advice.</li>
          <li>No live confirmation of benefits, limits, balances, authorisations, networks, or claim outcomes.</li>
          <li>Public documents can change, and scheme rules can differ by plan and year.</li>
        </ul>
      </section>

      <Disclaimer />
    </main>
  );
}
