'use client';

import { useRef, useState } from 'react';
import { FileText, Lock, Upload, X, ArrowUp, Loader2 } from 'lucide-react';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { COVER_SCOPE_NOTICE, COVER_ANSWER_NOTICE } from '@/lib/plan/notice';

interface Citation {
  pageStart: number;
  pageEnd: number;
  quote: string;
}
interface Segment {
  text: string;
  citations: Citation[];
}
interface Emergency {
  headline: string;
  body: string[];
  afterCare: string[];
}
interface Answer {
  question: string;
  segments: Segment[];
  disclaimer?: string;
}

const MAX_BYTES = 4 * 1024 * 1024;

const SUGGESTIONS = [
  'Do I need pre-authorisation for an MRI or CT scan?',
  'What are the limits and co-payments for specialist visits?',
  'Which hospitals or providers must I use to avoid a penalty?',
  'What does my plan say about chronic medication?',
];

const pageLabel = (c: Citation) =>
  c.pageEnd > c.pageStart ? `pp. ${c.pageStart}–${c.pageEnd}` : `p. ${c.pageStart}`;

const citeKey = (c: Citation) => `${c.pageStart}-${c.pageEnd}-${c.quote}`;

/**
 * "Your cover" — the member's plan PDF is held in this component's state only.
 * It is posted with each question and never stored client- or server-side.
 */
export function PlanCover() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (f: File | undefined) => {
    setFileError(null);
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Please choose a PDF of your plan document.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError('That file is over 4 MB. Try just the benefit pages, or a smaller version of the guide.');
      return;
    }
    setFile(f);
    setAnswer(null);
    setError(null);
  };

  const clear = () => {
    setFile(null);
    setAnswer(null);
    setError(null);
    setEmergency(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const ask = async (q: string) => {
    if (!file || loading) return;
    const text = q.trim();
    if (text.length < 5) return;
    setLoading(true);
    setError(null);
    setEmergency(null);
    try {
      const body = new FormData();
      body.append('plan', file);
      body.append('question', text);
      const res = await fetch('/api/plan-cover', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (data.isEmergency) {
        setEmergency(data.emergency);
        setAnswer(null);
      } else if (res.ok && Array.isArray(data.segments)) {
        setAnswer({ question: text, segments: data.segments, disclaimer: data.disclaimer });
        setQuestion('');
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Number each distinct citation once, in order of first appearance.
  const evidence: Citation[] = [];
  const numbered =
    answer?.segments.map((seg) => ({
      text: seg.text,
      refs: seg.citations.map((c) => {
        let i = evidence.findIndex((e) => citeKey(e) === citeKey(c));
        if (i === -1) i = evidence.push(c) - 1;
        return i + 1;
      }),
    })) ?? [];

  return (
    <div className="cover">
      <header className="cover-head">
        <p className="eyebrow">Your cover</p>
        <h1>Ask your own plan document</h1>
        <p className="cover-lead">
          Upload your plan&rsquo;s benefit guide. Every answer points to the page it came from &mdash; and says so
          when your document doesn&rsquo;t cover the question.
        </p>
      </header>

      <p className="callout callout-amber cover-scope" role="note">
        <strong>Information only.</strong> {COVER_SCOPE_NOTICE}
      </p>

      {!file ? (
        <div
          className={`cover-drop${dragging ? ' is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={22} aria-hidden />
          <div>
            <strong>Drop your plan PDF here</strong>
            <span>or choose it from your device &middot; PDF, up to 4&nbsp;MB</span>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            Choose PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="cover-file">
          <FileText size={20} aria-hidden />
          <span className="cover-file-name">{file.name}</span>
          <span className="cover-file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          <button type="button" className="cover-file-clear" onClick={clear} aria-label="Remove document">
            <X size={16} />
          </button>
        </div>
      )}
      {fileError && (
        <p className="cover-error" role="alert">
          {fileError}
        </p>
      )}

      <p className="cover-privacy">
        <Lock size={14} aria-hidden />
        Read in memory to answer your question, then discarded. Your document is never saved to our servers.
      </p>

      {file && (
        <form
          className="cover-ask"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <label htmlFor="cover-q" className="sr-only">
            Your question
          </label>
          <textarea
            id="cover-q"
            rows={2}
            maxLength={500}
            value={question}
            placeholder="e.g. Is an MRI covered, and do I need pre-authorisation?"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
          />
          <button className="btn btn-primary" disabled={loading || question.trim().length < 5} aria-label="Ask">
            {loading ? <Loader2 size={18} className="spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
      )}

      {file && !answer && !loading && !emergency && (
        <ul className="cover-suggest" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => ask(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <p className="cover-status" role="status">
          <Loader2 size={16} className="spin" /> Reading your document&hellip;
        </p>
      )}
      {error && (
        <p className="cover-error" role="alert">
          {error}
        </p>
      )}
      {emergency && <EmergencyBanner {...emergency} />}

      {answer && !loading && (
        <article className="cover-answer" aria-live="polite">
          <p className="cover-q">{answer.question}</p>
          <div className="cover-body">
            {numbered.map((seg, i) => (
              <span key={i}>
                {seg.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
                    <strong key={j}>{part.slice(2, -2)}</strong>
                  ) : (
                    part.replace(/\*/g, '')
                  )
                )}
                {seg.refs.map((n) => (
                  <a key={n} className="cite-mark" href={`#slip-${n}`} aria-label={`Source ${n}`}>
                    {n}
                  </a>
                ))}
              </span>
            ))}
          </div>

          {evidence.length > 0 ? (
            <section className="cover-evidence" aria-label="Sources from your document">
              <h2>From your document</h2>
              {evidence.map((c, i) => (
                <blockquote key={i} id={`slip-${i + 1}`} className="slip">
                  <span className="slip-tab">{pageLabel(c)}</span>
                  <p>&ldquo;{c.quote}&rdquo;</p>
                </blockquote>
              ))}
            </section>
          ) : (
            <p className="cover-nocite">
              No passage in your document is cited for this answer, so it does not come from your document. Do not
              rely on it; ask your scheme.
            </p>
          )}

          <p className="cover-caveat" role="note">
            {COVER_ANSWER_NOTICE}
          </p>
        </article>
      )}
    </div>
  );
}
