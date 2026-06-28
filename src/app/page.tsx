import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SCENARIOS } from '@/data/scenarios';
import { ScenarioIcon } from '@/components/ScenarioIcon';
import { Disclaimer } from '@/components/Disclaimer';
import { FeedbackForm } from '@/components/FeedbackForm';

export default function HomePage() {
  return (
    <main className="home">
      <section className="home-hero">
        <p className="eyebrow">A real-time medical aid navigation MVP</p>
        <h1 className="h-display">
          Know what to ask before you use your medical aid.
        </h1>
        <p className="home-value-line">
          Before you go, pay, claim, or authorise, know what to ask.
        </p>
        <p className="lead muted">
          Medical aid members are often not short of information. They are short
          of clarity at the moment they need to make a decision. This tool helps
          you slow the moment down and ask better questions before a benefit
          becomes a bill.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#pick-situation">
            Start a benefit check <ArrowRight size={17} />
          </a>
          <Link className="btn btn-secondary" href="/explainers">
            View explainers
          </Link>
        </div>
        <div className="trust-row" aria-label="Trust boundaries">
          <span>No diagnosis</span>
          <span>No claim guarantees</span>
          <span>No live scheme connection</span>
        </div>
      </section>

      <div className="callout callout-emergency" role="note">
        <strong>If this may be an emergency, get help first.</strong>{' '}
        Do not wait to check benefits. Call 10177 (ambulance) or 112 from a
        mobile, or go to the nearest appropriate emergency facility.
      </div>

      <section aria-labelledby="pick-situation">
        <h2 id="pick-situation" className="section-title">What&rsquo;s happening?</h2>
        <div className="scenario-grid">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              href={`/scenario/${s.id}`}
              className={`scenario-card${s.isEmergency ? ' is-emergency' : ''}`}
            >
              <span className="scenario-icon">
                <ScenarioIcon name={s.icon} />
              </span>
              <span className="scenario-card-body">
                <span className="scenario-card-title">{s.title}</span>
                <span className="scenario-card-blurb">{s.blurb}</span>
                <span className="scenario-card-action">Start</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sample-checklists" aria-labelledby="sample-checklists-title">
        <div className="sample-heading">
          <p className="eyebrow">Example outputs</p>
          <h2 id="sample-checklists-title">The kind of checklist you can expect</h2>
        </div>
        <div className="sample-grid">
          <article className="sample-card">
            <p className="sample-label">Decision brief preview</p>
            <h3>Going to casualty</h3>
            <ul>
              <li>Get care first if symptoms are severe.</li>
              <li>Ask if the facility is in-network for your plan.</li>
              <li>Keep ICD-10 codes, triage notes, and itemised accounts.</li>
              <li>Check emergency notification and co-payment rules afterwards.</li>
            </ul>
          </article>
          <article className="sample-card">
            <p className="sample-label">Decision brief preview</p>
            <h3>Planned scan/procedure</h3>
            <ul>
              <li>Ask whether pre-authorisation is required before booking.</li>
              <li>Request ICD-10 and procedure/tariff codes from the provider.</li>
              <li>Confirm network, DSP, and co-payment risks in writing.</li>
              <li>Keep the quote, referral, and authorisation reference.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="assurance" aria-label="What this tool does and does not do">
        <div className="assure-card">
          <h3>What this helps with</h3>
          <ul className="assure-list do">
            <li>The right questions to ask your scheme and provider</li>
            <li>Which codes and documents to request and keep</li>
            <li>Co-payment, network, and authorisation risks to check</li>
            <li>Plain-English explainers for the terms that trip people up</li>
          </ul>
        </div>
        <div className="assure-card">
          <h3>What it won&rsquo;t do</h3>
          <ul className="assure-list dont">
            <li>Diagnose you or recommend treatment</li>
            <li>Guarantee a claim outcome</li>
            <li>Tell you to switch schemes or plans</li>
            <li>Ask for your ID or membership number</li>
          </ul>
        </div>
      </section>

      <section className="mvp-limits" aria-labelledby="mvp-limits-title">
        <p className="eyebrow">What this MVP cannot do</p>
        <h2 id="mvp-limits-title">Always confirm directly</h2>
        <p>
          This MVP cannot confirm your personal benefits, balances, authorisation status,
          provider network status, PMB status, or claim outcome. It does not connect to
          live scheme systems. Always confirm directly with your medical scheme,
          healthcare provider, or accredited broker.
        </p>
      </section>

      <section className="home-feedback" aria-labelledby="home-feedback-title">
        <div className="home-feedback-head">
          <p className="eyebrow">Feedback</p>
          <h2 id="home-feedback-title">Help improve this MVP</h2>
          <p>
            Was this useful? Tell me what confused you about your medical aid,
            what this tool helped with, or what should be added next.
          </p>
        </div>
        <FeedbackForm />
      </section>

      <p className="small muted home-note">
        New to the terms? Read the{' '}
        <Link href="/explainers">plain-English explainers</Link> for PMBs, DSPs,
        ICD-10 codes, authorisation, and claims disputes. You can also review the{' '}
        <Link href="/sources">sources and limitations</Link>.
      </p>

      <Disclaimer />
    </main>
  );
}
