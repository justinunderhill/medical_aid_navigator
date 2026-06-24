'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { Scenario, Question } from '@/data/scenarios';
import { ChecklistView, type Checklist } from '@/components/ChecklistView';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { Disclaimer } from '@/components/Disclaimer';

type AnswerValue = string | boolean | string[];

interface EmergencyPayload {
  headline: string;
  body: string[];
  afterCare: string[];
}

export function ScenarioFlow({ scenario }: { scenario: Scenario }) {
  const [step, setStep] = useState(0); // 0..questions.length-1, then result
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [emergency, setEmergency] = useState<EmergencyPayload | null>(null);

  const questions = scenario.questions;
  const onResult = step >= questions.length;

  const setAnswer = (id: string, value: AnswerValue) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const freeText =
        typeof answers.whatHappened === 'string'
          ? answers.whatHappened
          : typeof answers.situation === 'string'
            ? answers.situation
            : typeof answers.context === 'string'
              ? answers.context
              : typeof answers.rejectionReason === 'string'
                ? answers.rejectionReason
                : '';

      let scenarioId = scenario.id;

      if (scenario.isTriage) {
        try {
          const classifyRes = await fetch('/api/classify-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: freeText }),
          });
          const classified = await classifyRes.json();
          if (classified.isEmergency) {
            setEmergency(classified.emergency);
            setStep(questions.length);
            return;
          }
          if (classifyRes.ok && typeof classified.scenarioId === 'string') {
            scenarioId = classified.scenarioId;
          }
        } catch {
          scenarioId = scenario.id;
        }
      }

      const res = await fetch('/api/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          freeText,
          answers,
        }),
      });
      const data = await res.json();
      if (data.isEmergency) {
        setEmergency(data.emergency);
      } else if (data.checklist) {
        setChecklist(data.checklist);
      } else {
        setError(
          data.message ??
            'We could not generate guidance right now. Please contact your scheme directly.'
        );
      }
      setStep(questions.length);
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
      setStep(questions.length);
    } finally {
      setLoading(false);
    }
  };

  // ---- Result view ----
  if (onResult) {
    return (
      <main className="shell">
        <Link href="/" className="link-quiet" style={{ display: 'inline-flex', gap: 4, marginBottom: 'var(--sp-4)' }}>
          <ArrowLeft size={16} /> Start over
        </Link>
        <div className="case-header">
          <p className="eyebrow">Case output</p>
          <h1>{scenario.title}</h1>
          <div className="case-meta">
            <span className="case-pill">{emergency ? 'urgent guidance' : 'working checklist'}</span>
            <span className="case-pill">confirm with scheme</span>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
            <span className="spinner" /> <span className="muted">Preparing your checklist...</span>
          </div>
        )}

        {!loading && emergency && (
          <>
            <EmergencyBanner
              headline={emergency.headline}
              body={emergency.body}
              afterCare={emergency.afterCare}
            />
            <Disclaimer />
          </>
        )}

        {!loading && checklist && (
          <>
            <ChecklistView checklist={checklist} />
            <p className="small muted" style={{ marginTop: 'var(--sp-6)' }}>
              Was this useful? <Link href={`/feedback?scenario=${scenario.id}`}>Tell us</Link>.
            </p>
          </>
        )}

        {!loading && error && (
          <div className="callout callout-amber">
            <strong>We hit a snag.</strong>
            <p style={{ margin: '4px 0 0' }}>{error}</p>
          </div>
        )}
      </main>
    );
  }

  // ---- Question view ----
  const q = questions[step];
  const isLast = step === questions.length - 1;
  const progress = `${Math.round(((step + 1) / questions.length) * 100)}%`;

  return (
    <main className="shell">
      <Link href="/" className="link-quiet" style={{ display: 'inline-flex', gap: 4, marginBottom: 'var(--sp-4)' }}>
        <ArrowLeft size={16} /> Back to situations
      </Link>

      <div className="case-header">
        <p className="eyebrow">Case intake</p>
        <h1>{scenario.title}</h1>
        <div className="case-meta">
          <span className="case-pill">Question {step + 1} of {questions.length}</span>
          <span className="case-pill">{scenario.isEmergency ? 'urgent path' : 'benefit checklist'}</span>
        </div>
      </div>

      <section className="question-panel">
        <div className="question-head">
          <div className="step-track" aria-hidden>
            <div className="step-fill" style={{ width: progress }} />
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Answer only what you know. The checklist will focus on what to confirm next.
          </p>
        </div>

        <QuestionField question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />

        <div className="question-actions">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={18} /> Back
            </button>
          )}
          {!isLast ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit}>
              Generate checklist <ArrowRight size={18} />
            </button>
          )}
          {q.optional && (
            <button className="link-quiet" onClick={() => (isLast ? submit() : setStep((s) => s + 1))}>
              Skip
            </button>
          )}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  if (question.type === 'text') {
    return (
      <div>
        <label htmlFor={question.id}>{question.label}</label>
        <textarea
          id={question.id}
          rows={4}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type here… (you can keep it short)"
        />
      </div>
    );
  }

  if (question.type === 'boolean') {
    return (
      <div>
        <label>{question.label}</label>
        <div className="chip-group">
          {['Yes', 'No'].map((opt) => {
            const v = opt === 'Yes';
            return (
              <button
                key={opt}
                className="chip"
                aria-pressed={value === v}
                onClick={() => onChange(v)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'multi') {
    const arr = (value as string[]) ?? [];
    return (
      <div>
        <label>{question.label}</label>
        <div className="chip-group">
          {question.options?.map((opt) => {
            const on = arr.includes(opt);
            return (
              <button
                key={opt}
                className="chip"
                aria-pressed={on}
                onClick={() =>
                  onChange(on ? arr.filter((x) => x !== opt) : [...arr, opt])
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // single
  return (
    <div>
      <label>{question.label}</label>
      <div className="chip-group">
        {question.options?.map((opt) => (
          <button
            key={opt}
            className="chip"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
