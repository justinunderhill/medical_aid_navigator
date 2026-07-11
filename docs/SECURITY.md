# Security & Privacy Posture

This document describes the security and privacy decisions in the MVP and what
must change before a public, high-traffic launch.

---

## 1. Data minimisation (POPIA-aware)

The app is built so there is as little to protect as possible.

We do **not** collect or store:
- ID numbers
- Medical aid membership numbers
- Full medical history or clinical records
- Payment card data
- Exact home address

What may be processed transiently to generate guidance (not stored against an
identity):
- The selected scenario
- Optional free text the user types
- Optional scheme/plan name the user chooses to enter

**Nothing is persisted.** The app has no database and stores no data against an
identity. See `content/core/privacy-principles.md`.

---

## 2. No PII in logs

- Error logging records error *messages*, not user input bodies
  (`src/app/api/*/route.ts`).
- Before launch: review any added logging/analytics for the same standard.

---

## 3. Input handling & prompt-injection

- All user text is sanitised (`sanitiseUserText`): control characters stripped,
  length capped (1500 chars for free text).
- Free text, scheme names, and plan names embedded in prompts are wrapped in
  `<<<USER_INPUT>>>` delimiters and the system prompt instructs the model to
  treat delimited content as **data, not instructions**
  (`src/lib/safety/guards.ts`, `content/prompts/system-prompt.md`).
- The **output validator** is the safety net if injection still nudges the model
  toward forbidden phrasing — claim guarantees, diagnosis, broker advice, and
  scheme-blaming are softened post-generation regardless of how they arose
  (`src/lib/safety/outputValidator.ts`).

---

## 3a. Emergency detection — known residual risk

Emergency detection (`src/lib/safety/emergency.ts`) is deterministic and runs
before/independently of the AI. It escalates on three signals: an
emergency-by-definition scenario, any guided-flow question flagged
`emergencyTrigger` answered affirmatively (data-driven — no hard-coded answer
key), or a red-flag keyword in free text.

**Residual gap:** keyword matching is English-only substring matching, so it can
miss real emergencies phrased in other SA languages or in wording not on the
list (e.g. "my chest really hurts"). The AI layer is the normal backstop for
this — but **when the AI is unavailable**, the fallback path cannot know the
situation isn't an emergency. To avoid burying a missed emergency under routine
benefit steps, **every fallback leads with a static urgent-care line**
(`FALLBACK_URGENT_CARE_LEAD`) directing the user to call 10177 / 112 if symptoms
are severe.

**Before launch:** broaden the red-flag term list (including local-language
terms) and add monitoring on fallback frequency.

---

## 4. Rate limiting

- `src/lib/safety/guards.ts` implements a simple per-IP, per-minute limiter
  (default 20/min, `RATE_LIMIT_PER_MINUTE`) and sweeps expired entries so a
  long-lived process does not retain stale client keys forever.
- **Production note:** this limiter is **in-memory and per-server-instance**. On
  Vercel's serverless/edge model, instances are ephemeral and not shared, so
  this is a basic safeguard only — **not** a distributed guarantee. Before a
  real launch, move to a shared store:
  - Upstash Redis (`@upstash/ratelimit`) — simplest on Vercel, or
  - Vercel KV, or
  - an API gateway / WAF rate limit.

---

## 5. Transport & headers

- Security headers set in `next.config.mjs`: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a restrictive
  `Permissions-Policy`.
- `poweredByHeader` disabled.
- HTTPS is provided by the host (Vercel) in production.

---

## 6. Secrets

- All provider keys are server-side env vars, never imported into a client
  component.
- `.env*` is gitignored. Only `.env.example` (placeholders) is committed.

---

## 7. Pre-launch checklist

- [ ] Move rate limiting to a shared store (Upstash/Vercel KV).
- [ ] Add monitoring/alerting on output-validator **hard** flags (signals the
      model attempting forbidden phrasing).
- [ ] Legal/compliance review of all user-facing copy and disclaimers before
      any public promotion.
- [ ] Confirm POPIA stance with a privacy advisor if any storage is added.
- [ ] Penetration test of the public endpoints.
