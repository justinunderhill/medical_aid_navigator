import Link from 'next/link';
import { ArrowLeft, BookOpen, FileQuestion, ListChecks } from 'lucide-react';
import { CONCEPTS, QUICK_DEFINITIONS } from '@/data/concepts';
import { getConcept } from '@/lib/knowledge/loader';
import { Disclaimer } from '@/components/Disclaimer';

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'sectionLabel'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

function inlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function parseList(block: string, ordered: boolean) {
  const marker = ordered ? /^\d+\.\s*/ : /^-\s*/;
  const items: string[] = [];

  block.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (marker.test(trimmed)) {
      items.push(trimmed.replace(marker, ''));
    } else if (items.length > 0) {
      items[items.length - 1] = `${items[items.length - 1]} ${trimmed}`;
    }
  });

  return items;
}

/** Minimal, safe markdown-ish parser for our own trusted content. */
function parseContent(md: string): MarkdownBlock[] {
  const blocks = md.split('\n\n');
  const parsed: MarkdownBlock[] = [];

  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('# ')) {
      return; // title handled separately
    }
    if (trimmed.startsWith('_Last reviewed:')) {
      return;
    }
    if (trimmed.startsWith('- ')) {
      parsed.push({ type: 'ul', items: parseList(trimmed, false) });
      return;
    }
    if (/^\d+\./.test(trimmed)) {
      parsed.push({ type: 'ol', items: parseList(trimmed, true) });
      return;
    }
    if (trimmed.endsWith(':') && trimmed.length < 80) {
      parsed.push({ type: 'sectionLabel', text: trimmed });
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
        <p key={i} className="explainer-copy">
          {inlineText(block.text)}
        </p>
      );
    }
    if (block.type === 'sectionLabel') {
      return (
        <h3 key={i} className="explainer-subhead">
          {inlineText(block.text.replace(/:$/, ''))}
        </h3>
      );
    }
    const ListTag = block.type === 'ol' ? 'ol' : 'ul';
    return (
      <ListTag key={i} className="explainer-list">
        {block.items.map((item, j) => (
          <li key={j}>{inlineText(item)}</li>
        ))}
      </ListTag>
    );
  });
}

export default function ExplainersPage() {
  return (
    <main className="desk-shell explainers-page">
      <Link href="/" className="link-quiet explainers-back">
        <ArrowLeft size={16} /> Home
      </Link>

      <header className="explainers-hero">
        <div>
          <p className="eyebrow">Plain-English explainers</p>
          <h1>Understand the terms before you call the scheme</h1>
          <p className="explainers-lead">
            Clear definitions for the benefit rules, codes, and process steps that
            most often affect medical aid claims.
          </p>
        </div>
        <div className="review-stamp">
          <BookOpen size={18} />
          <span>Knowledge reviewed 2026-06</span>
        </div>
      </header>

      <div className="explainers-layout">
        <aside className="topic-index" aria-label="Explainer topics">
          <div className="topic-index-head">
            <ListChecks size={17} />
            <h2>Topics</h2>
          </div>
          <nav>
            {CONCEPTS.map((concept) => (
              <a key={concept.slug} href={`#${concept.slug}`}>
                {concept.term}
              </a>
            ))}
          </nav>
        </aside>

        <div className="explainers-content">
          <section className="quick-definitions" aria-labelledby="quick-definitions-title">
            <div className="section-heading">
              <FileQuestion size={18} />
              <h2 id="quick-definitions-title">Quick definitions</h2>
            </div>
            <div className="definition-grid">
              {QUICK_DEFINITIONS.map((concept) => (
                <article key={concept.term} className="definition-card">
                  <h3>{concept.term}</h3>
                  <p>{concept.short}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="concept-stack" aria-label="Full concept explainers">
            {CONCEPTS.map((concept) => {
              const content = getConcept(concept.slug);
              return (
                <article key={concept.slug} id={concept.slug} className="explainer-article">
                  <header className="explainer-article-head">
                    <p className="eyebrow">Explainer</p>
                    <h2>{concept.term}</h2>
                    <p>{concept.short}</p>
                  </header>
                  <div className="explainer-body">{renderContent(content)}</div>
                </article>
              );
            })}
          </section>
        </div>
      </div>

      <Disclaimer />
    </main>
  );
}
