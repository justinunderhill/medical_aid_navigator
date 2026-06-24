import Link from 'next/link';
import { CONCEPTS, QUICK_DEFINITIONS } from '@/data/concepts';
import { getConcept } from '@/lib/knowledge/loader';
import { Disclaimer } from '@/components/Disclaimer';

/** Minimal, safe markdown-ish renderer for our own trusted content. */
function renderContent(md: string) {
  const blocks = md.split('\n\n');
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('# ')) {
      return null; // title handled separately
    }
    if (trimmed.startsWith('_Last reviewed:')) {
      return null;
    }
    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').map((l) => l.replace(/^- /, ''));
      return (
        <ul key={i} style={{ paddingLeft: '18px', marginBottom: 'var(--sp-3)' }}>
          {items.map((it, j) => (
            <li key={j} style={{ marginBottom: '4px' }}>{it}</li>
          ))}
        </ul>
      );
    }
    if (/^\d+\./.test(trimmed)) {
      const items = trimmed.split('\n').map((l) => l.replace(/^\d+\.\s*/, ''));
      return (
        <ol key={i} style={{ paddingLeft: '20px', marginBottom: 'var(--sp-3)' }}>
          {items.map((it, j) => (
            <li key={j} style={{ marginBottom: '4px' }}>{it}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className="muted" style={{ marginBottom: 'var(--sp-3)' }}>
        {trimmed}
      </p>
    );
  });
}

export default function ExplainersPage() {
  return (
    <main className="shell">
      <Link href="/" className="link-quiet" style={{ marginBottom: 'var(--sp-4)', display: 'inline-block' }}>
        ← Home
      </Link>
      <p className="eyebrow">Plain-English explainers</p>
      <h1 className="h-display" style={{ marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        The terms, without the jargon.
      </h1>
      <p className="small muted" style={{ marginTop: 'calc(var(--sp-3) * -1)', marginBottom: 'var(--sp-6)' }}>
        Knowledge last reviewed: 2026-06.
      </p>

      {/* Quick definitions strip */}
      <div className="card" style={{ marginBottom: 'var(--sp-8)' }}>
        <h2 style={{ marginBottom: 'var(--sp-3)' }}>Quick definitions</h2>
        {[...QUICK_DEFINITIONS].map((c) => (
          <p key={c.term} className="small" style={{ marginBottom: 'var(--sp-2)' }}>
            <strong>{c.term}:</strong> <span className="muted">{c.short}</span>
          </p>
        ))}
      </div>

      {/* Full concept explainers */}
      {CONCEPTS.map((c) => {
        const content = getConcept(c.slug);
        return (
          <article key={c.slug} id={c.slug} style={{ marginBottom: 'var(--sp-8)' }}>
            <h2 style={{ marginBottom: 'var(--sp-2)' }}>{c.term}</h2>
            {renderContent(content)}
          </article>
        );
      })}

      <Disclaimer />
    </main>
  );
}
