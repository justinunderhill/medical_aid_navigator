import Link from 'next/link';
import { ArrowLeft, CircleAlert, Database, FileText, ShieldCheck } from 'lucide-react';
import { getCoreContent } from '@/lib/knowledge/loader';
import { Disclaimer } from '@/components/Disclaimer';

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'sectionLabel'; text: string }
  | { type: 'ul'; items: string[] };

function parseContent(md: string): MarkdownBlock[] {
  const parsed: MarkdownBlock[] = [];

  md.split('\n\n').forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('_Last reviewed:')) {
      return;
    }
    if (trimmed.startsWith('- ')) {
      parsed.push({
        type: 'ul',
        items: trimmed.split('\n').map((line) => line.replace(/^- /, '').trim()),
      });
      return;
    }
    if (trimmed.endsWith(':') && trimmed.length < 80) {
      parsed.push({ type: 'sectionLabel', text: trimmed.replace(/:$/, '') });
      return;
    }
    parsed.push({ type: 'paragraph', text: trimmed.replace(/\n/g, ' ') });
  });

  return parsed;
}

function renderContent(md: string) {
  return parseContent(md).map((block, i) => {
    if (block.type === 'paragraph') {
      return (
        <p key={i} className="about-copy">
          {block.text}
        </p>
      );
    }
    if (block.type === 'sectionLabel') {
      return (
        <h3 key={i} className="about-subhead">
          {block.text}
        </h3>
      );
    }
    return (
      <ul key={i} className="about-list">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  });
}

export default function AboutPage() {
  const disclaimer = getCoreContent('disclaimer');
  const privacy = getCoreContent('privacy-principles');

  return (
    <main className="desk-shell about-page">
      <Link href="/" className="link-quiet about-back">
        <ArrowLeft size={16} /> Home
      </Link>

      <header className="about-hero">
        <div>
          <p className="eyebrow">About &amp; privacy</p>
          <h1>Built to help you ask better questions, not make decisions for you</h1>
          <p className="about-lead">
            Medical Aid Navigator keeps the experience practical and careful:
            educational guidance, clear limits, and minimal data handling.
          </p>
        </div>
        <div className="about-review">
          <ShieldCheck size={18} />
          <span>Privacy stance reviewed 2026-06</span>
        </div>
      </header>

      <section className="about-principles" aria-label="Key principles">
        <article className="principle-card">
          <FileText size={20} />
          <h2>Educational only</h2>
          <p>Use it to organise questions and documents before confirming with your scheme or provider.</p>
        </article>
        <article className="principle-card">
          <Database size={20} />
          <h2>Data minimised</h2>
          <p>No account is required, and the tool does not ask for ID or membership numbers.</p>
        </article>
        <article className="principle-card">
          <CircleAlert size={20} />
          <h2>Urgent care stays urgent</h2>
          <p>If symptoms are urgent, seek medical care immediately instead of relying on this tool.</p>
        </article>
      </section>

      <div className="about-content-grid">
        <section className="about-panel" aria-labelledby="about-tool-title">
          <header className="about-panel-head">
            <p className="eyebrow">Scope</p>
            <h2 id="about-tool-title">About this tool</h2>
          </header>
          <div className="about-panel-body">{renderContent(disclaimer)}</div>
        </section>

        <section className="about-panel" aria-labelledby="privacy-title">
          <header className="about-panel-head">
            <p className="eyebrow">Information handling</p>
            <h2 id="privacy-title">Privacy</h2>
          </header>
          <div className="about-panel-body">{renderContent(privacy)}</div>
        </section>
      </div>

      <Disclaimer />
    </main>
  );
}
