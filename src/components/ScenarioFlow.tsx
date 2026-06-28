'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { Scenario, Question } from '@/data/scenarios';
import { ChecklistView, type Checklist } from '@/components/ChecklistView';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { Disclaimer } from '@/components/Disclaimer';

type AnswerValue = string | boolean | string[];

const FREE_TEXT_PRIVACY_NOTICE =
  'Please do not enter your ID number, medical aid member number, full address, or highly sensitive clinical details. A general description is enough.';

interface EmergencyPayload {
  headline: string;
  body: string[];
  afterCare: string[];
}

export function ScenarioFlow({ scenario }: { scenario: Scenario }) {
  const [step, setStep] = useState(0); // 0..questions.length-1, then result
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [emergencyGateComplete, setEmergencyGateComplete] = useState(!scenario.isEmergency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [emergency, setEmergency] = useState<EmergencyPayload | null>(null);

  const questions = scenario.questions;
  const onResult = step >= questions.length;

  const setAnswer = (id: string, value: AnswerValue) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const showUrgentGuidance = () => {
    setEmergency({
      headline: 'Get urgent medical help first',
      body: [
        'If severe symptoms are present, do not use this tool before seeking urgent care.',
        'Call 10177 for an ambulance, call 112 from a mobile phone, or go to the nearest appropriate emergency facility.',
      ],
      afterCare: [
        'Once the person is stable, keep all hospital records, authorisation references, ICD-10 codes, and itemised accounts.',
        'After care is underway, ask your scheme what emergency notification or authorisation steps are required.',
      ],
    });
    setStep(questions.length);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    // Switch to the result view immediately so the user sees the
    // "generating" indicator during the wait, not a frozen question.
    setStep(questions.length);
    window.scrollTo({ top: 0, behavior: 'auto' });
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
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
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
          <p className="case-blurb">{scenario.blurb}</p>
          <div className="case-meta">
            <span className="case-pill">{emergency ? 'urgent guidance' : 'decision brief'}</span>
            <span className="case-pill">confirm with scheme</span>
          </div>
        </div>

        {loading && <GeneratingChecklist />}

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
            <div className="feedback-cta">
              <div>
                <p className="eyebrow">Feedback</p>
                <strong>Help improve this MVP</strong>
                <p className="small muted">
                  Was this useful? Tell me what confused you, what helped, or what should be added next.
                </p>
              </div>
              <Link className="btn btn-primary" href={`/feedback?scenario=${scenario.id}`}>
                Share feedback
              </Link>
            </div>
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

  if (!emergencyGateComplete) {
    return (
      <main className="shell">
        <Link href="/" className="link-quiet" style={{ display: 'inline-flex', gap: 4, marginBottom: 'var(--sp-4)' }}>
          <ArrowLeft size={16} /> Back to situations
        </Link>

        <section className="emergency-gate" aria-labelledby="emergency-gate-title">
          <div className="emergency-gate-icon" aria-hidden>
            <ShieldAlert size={26} />
          </div>
          <p className="eyebrow">Emergency first</p>
          <h1 id="emergency-gate-title">{scenario.title}</h1>
          <p>
            If severe symptoms are present, do not use this tool before seeking urgent care.
            Get medical help first; benefit questions can wait until care is underway.
          </p>
          <div className="emergency-gate-actions">
            <button className="btn btn-alert" onClick={showUrgentGuidance}>
              I need urgent help now
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setAnswer('emergencyGate', 'Care is already underway');
                setEmergencyGateComplete(true);
              }}
            >
              Care is already underway
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setAnswer('emergencyGate', 'I need after-care documentation guidance');
                setEmergencyGateComplete(true);
              }}
            >
              I need after-care documentation guidance
            </button>
          </div>
        </section>

        <Disclaimer />
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
        <p className="case-blurb">{scenario.blurb}</p>
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
          <p className="field-privacy-note">{FREE_TEXT_PRIVACY_NOTICE}</p>
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

const GENERATING_STEPS = [
  'Reviewing your answers',
  'Checking the relevant scheme rules',
  'Working out what to confirm next',
  'Putting your checklist together',
];

function GeneratingChecklist() {
  const [seconds, setSeconds] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    // Advance the status message, holding on the last one until done.
    const advance = setInterval(
      () => setStepIndex((i) => Math.min(i + 1, GENERATING_STEPS.length - 1)),
      2200
    );
    return () => {
      clearInterval(tick);
      clearInterval(advance);
    };
  }, []);

  return (
    <div className="generating" role="status" aria-live="polite">
      <div className="generating-head">
        <span className="spinner" />
        <div>
          <strong>Building your checklist…</strong>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            This usually takes a few seconds. Please don’t close this page.
          </p>
        </div>
        <span className="generating-timer" aria-hidden>
          {seconds}s
        </span>
      </div>

      <ul className="generating-steps" aria-hidden>
        {GENERATING_STEPS.map((label, i) => (
          <li
            key={label}
            className={
              i < stepIndex ? 'is-done' : i === stepIndex ? 'is-active' : 'is-pending'
            }
          >
            <span className="generating-dot" />
            {label}
          </li>
        ))}
      </ul>
    </div>
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
        <p className="field-privacy-note">{FREE_TEXT_PRIVACY_NOTICE}</p>
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
