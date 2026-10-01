'use client';

import { Fragment, createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUp, FileText, MessageCircle, Paperclip, RotateCcw, X } from 'lucide-react';
import type { ConciergeTurn } from '@/lib/concierge/shared';

function useConversation() {
  const [turns, setTurns] = useState<ConciergeTurn[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  function reset(nextFile: File | null = null) {
    active.current?.abort();
    active.current = null;
    setBusy(false); setPending(''); setTurns([]); setFile(nextFile); setDraft(''); setError('');
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setPending(question); setError(''); setDraft('');
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const body = new FormData();
      body.set('question', question);
      body.set('history', JSON.stringify(turns.slice(-6).flatMap(t => [
        { role: 'user', content: t.question },
        { role: 'assistant', content: t.reply.segments.map(s => s.text).join('\n').slice(0, 3000) },
      ])));
      if (file) body.set('plan', file);
      const response = await fetch('/api/concierge', { method: 'POST', body, signal: controller.signal });
      const data = await response.json().catch(() => ({ error: 'MAN could not answer right now. Please try again.' }));
      if (!response.ok) throw new Error(data.error || 'MAN could not answer. Please try again.');
      if (!Array.isArray(data.segments) || !Array.isArray(data.links)) throw new Error('Unexpected response. Please try again.');
      if (active.current !== controller) return;
      setTurns(previous => [...previous, { question, reply: data }]);
    } catch (err) {
      if (active.current === controller) {
        setDraft(question);
        setError(controller.signal.aborted ? 'That took too long. Please try again.' : err instanceof TypeError ? 'Check your connection and try again.' : err instanceof Error ? err.message : 'Check your connection and try again.');
      }
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) { active.current = null; setBusy(false); setPending(''); }
    }
  }

  function attach(next: File) {
    if (!next.name.toLowerCase().endsWith('.pdf') || !next.size || next.size > 4 * 1024 * 1024) {
      setError('Choose a non-empty PDF of up to 4 MB.'); return;
    }
    reset(next);
  }
  return { turns, file, draft, setDraft, busy, pending, error, ask, reset, attach };
}

const ConversationContext = createContext<ReturnType<typeof useConversation> | null>(null);
export function ManProvider({ children }: { children: ReactNode }) {
  const conversation = useConversation();
  return <ConversationContext.Provider value={conversation}>{children}</ConversationContext.Provider>;
}

const starters = ['Help me understand my benefits', 'I’m seeing a specialist. Where do I start?', 'My claim was rejected. What can I do?', 'What can you help me with?'];
const planStarters = ['Summarise this plan’s key benefits and benefit year.', 'What does my plan say about scans and authorisation?', 'What are the specialist limits and co-payments?', 'What does this document say about chronic medication?'];

function Text({ value }: { value: string }) {
  return <>{value.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</>;
}

export function ManConcierge({ dedicated = false }: { dedicated?: boolean }) {
  const chat = useContext(ConversationContext);
  const upload = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const count = chat?.turns.length ?? 0;
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = count || chat?.busy ? transcript.current.scrollHeight : 0;
  }, [count, chat?.busy]);
  if (!chat) return null;
  const { file, turns, busy, pending, draft, error } = chat;
  return (
    <section className={`man${dedicated ? ' man-dedicated' : ''}`} aria-label="Chat with MAN">
      <header className="man-heading">
        <span className="man-avatar" aria-hidden><MessageCircle size={26} /></span>
        <div><h2>MAN<span>Medical Aid Navigator</span></h2><p className="man-presence">{busy ? 'Preparing your answer' : 'Your AI concierge'}</p></div>
        <button className="man-reset" type="button" onClick={() => chat.reset()} aria-label="Clear chat and remove plan" title="New chat"><RotateCcw size={18} /></button>
      </header>
      {!dedicated && <Link className="man-space-link" href="/man">Open MAN’s conversation space →</Link>}

      {file && <div className="man-file"><FileText size={18} aria-hidden /><span>{file.name}<small>Attached for this conversation</small></span><button type="button" onClick={() => chat.reset()} aria-label="Remove plan and clear chat"><X size={18} /></button></div>}
      <div className="man-transcript" ref={transcript} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        {!turns.length && !busy && <div className="man-welcome">
          <article className="man-answer"><p className="man-speaker">MAN</p><p>Hi, I’m MAN. Ask me about your medical aid or attach your benefits plan. I’ll help you understand it and find your next step.</p></article>
          <div className="man-starters" aria-label="Suggested questions">{(file ? planStarters : starters).map(text => <button key={text} type="button" onClick={() => chat.ask(text)}>{text}<span aria-hidden>↗</span></button>)}</div>
        </div>}
        {turns.map((turn, i) => <div className="man-turn" key={i}>
          <div className="man-question"><span className="sr-only">You: </span>{turn.question}</div>
          <article className={`man-answer${turn.reply.isEmergency ? ' man-emergency' : ''}`}>
            <p className="man-speaker">{turn.reply.isEmergency ? 'Get urgent help first' : 'MAN'}</p>
            <div className="man-answer-text">{turn.reply.segments.map((segment, j) => <Fragment key={j}>
              <Text value={segment.text} />
              {segment.citations.map((citation, k) => <details className="man-citation" key={k}>
                <summary>Plan evidence · {citation.pageStart === citation.pageEnd ? `page ${citation.pageStart}` : `pages ${citation.pageStart}–${citation.pageEnd}`}</summary>
                <blockquote>{citation.quote}</blockquote>
              </details>)}
            </Fragment>)}</div>
            {!turn.reply.isEmergency && <>
              <p className="man-source-note">{file ? 'Only passages with page citations are evidence from your plan. Other guidance is general.' : 'Based on the app’s educational knowledge. Personal cover needs your plan and scheme confirmation.'}</p>
              <div className="man-links">{turn.reply.links.map(link => <Link key={link.href} href={link.href}>{link.label} →</Link>)}</div>
            </>}
          </article>
        </div>)}
        {busy && <div className="man-turn"><div className="man-question"><span className="sr-only">You: </span>{pending}</div><div className="man-answer man-working" role="status"><span className="man-typing" aria-hidden="true"><i /><i /><i /></span><span>{file ? 'Reading your plan' : 'MAN is thinking'}<span className="sr-only">. Please wait for your answer.</span></span></div></div>}
        {error && <div className="cover-error" role="alert"><p>{error} Your message is ready to retry below.</p><p>If symptoms are severe, call 112 or 10177.</p><Link href="/#pick-situation">Use the guided tools →</Link></div>}
        <details className="man-info"><summary>Privacy &amp; guidance</summary>
          <p className="man-privacy">PDF up to 4 MB / 100 pages. Attaching or removing a plan starts a new chat. Your chat and PDF stay in this tab’s memory until cleared or refreshed; relevant messages and the PDF are sent to our AI provider to answer each question. They are not saved by this app.</p>
          <p className="man-disclaimer">Educational guidance, not medical or financial advice. MAN can make mistakes; check the cited text and confirm cover with your scheme. No live balances or claim status. <Link href="/about">Privacy</Link></p>
        </details>
      </div>
      <form className="man-composer" onSubmit={event => { event.preventDefault(); void chat.ask(draft); }}>
        <label className="sr-only" htmlFor="man-question">Ask MAN</label>
        <textarea id="man-question" rows={1} maxLength={1500} readOnly={busy} value={draft} onChange={event => chat.setDraft(event.target.value)} placeholder={busy ? 'MAN is preparing your answer…' : file ? 'Ask about your plan…' : 'Message MAN…'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void chat.ask(draft); } }} />
        <div className="man-composer-actions"><button type="button" className="man-attach" disabled={busy} onClick={() => upload.current?.click()}><Paperclip size={17} />{file ? 'Replace plan' : 'Attach benefits PDF'}</button><button className="btn btn-primary" disabled={busy || !draft.trim()} aria-label="Send message to MAN"><ArrowUp size={20} /></button></div>
        <input ref={upload} type="file" accept="application/pdf,.pdf" hidden onChange={event => { const next = event.target.files?.[0]; if (next) chat.attach(next); event.target.value = ''; }} />
      </form>
    </section>
  );
}
