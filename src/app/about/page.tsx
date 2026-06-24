import Link from 'next/link';
import { getCoreContent } from '@/lib/knowledge/loader';
import { Disclaimer } from '@/components/Disclaimer';

export default function AboutPage() {
  const disclaimer = getCoreContent('disclaimer');
  const privacy = getCoreContent('privacy-principles');

  const para = (md: string) =>
    md
      .split('\n\n')
      .filter((b) => {
        const trimmed = b.trim();
        return !trimmed.startsWith('#') && !trimmed.startsWith('_Last reviewed:');
      })
      .map((b, i) => {
        const t = b.trim();
        if (t.startsWith('- ')) {
          return (
            <ul key={i} style={{ paddingLeft: '18px', marginBottom: 'var(--sp-3)' }}>
              {t.split('\n').map((l, j) => (
                <li key={j}>{l.replace(/^- /, '')}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="muted" style={{ marginBottom: 'var(--sp-3)' }}>
            {t}
          </p>
        );
      });

  return (
    <main className="shell">
      <Link href="/" className="link-quiet" style={{ marginBottom: 'var(--sp-4)', display: 'inline-block' }}>
        ← Home
      </Link>
      <p className="eyebrow">About &amp; privacy</p>
      <h1 className="h-display" style={{ marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        What this is, and how we handle your information.
      </h1>

      <section style={{ marginBottom: 'var(--sp-8)' }}>
        <h2 style={{ marginBottom: 'var(--sp-3)' }}>About this tool</h2>
        {para(disclaimer)}
      </section>

      <section style={{ marginBottom: 'var(--sp-8)' }}>
        <h2 style={{ marginBottom: 'var(--sp-3)' }}>Privacy</h2>
        {para(privacy)}
      </section>

      <Disclaimer />
    </main>
  );
}
