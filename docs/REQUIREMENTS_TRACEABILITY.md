# Requirements Traceability

Maps each requirement from the spec (sections 19–20) to where it is implemented,
so coverage can be verified. Status reflects the MVP foundation as built.

## Functional Requirements

| ID | Requirement | Implemented in | Status |
|----|-------------|----------------|--------|
| FR1 | Homepage | `src/app/page.tsx` — hero, what it does/doesn't do, always-visible emergency notice, link to explainers | ✅ |
| FR2 | Scenario selection | `src/data/scenarios/index.ts` (10 scenarios + triage), rendered as cards in `src/app/page.tsx`; routes to `src/app/scenario/[id]/page.tsx`; triage calls `/api/classify-scenario` and renders the resolved checklist inline | ✅ |
| FR3 | Guided question flow (skippable) | `src/components/ScenarioFlow.tsx` — stepper with single/multi/text/boolean questions, every optional question has a **Skip** link | ✅ |
| FR4 | Emergency safety layer | `src/lib/safety/emergency.ts` (deterministic, AI-independent) + fast-path in `src/app/api/navigate/route.ts` + `src/components/EmergencyBanner.tsx`; static copy with SA numbers (10177/112) | ✅ |
| FR5 | Benefit pathway output | `src/lib/ai/index.ts` (`generateChecklist`) → structured `NavigationChecklist`; rendered by `src/components/ChecklistView.tsx`; disclaimer always appended | ✅ |
| FR6 | PMB explainer | `content/concepts/pmb.md`, listed on `src/app/explainers/page.tsx`; also grounds the AI via `src/lib/knowledge/loader.ts` | ✅ |
| FR7 | DSP & network explainer | `content/concepts/dsp.md` + explainers page | ✅ |
| FR8 | Authorisation checklist | `content/concepts/authorisation.md` + `planned-procedure` scenario (`content/scenarios/planned-procedure.md`) | ✅ |
| FR9 | Chronic benefit checklist | `content/concepts/chronic-benefit.md` + `chronic-condition` scenario | ✅ |
| FR10 | Claim rejection assistant | `claim-rejection` scenario (`src/data/scenarios`, `content/scenarios/claim-rejection.md`) + `content/concepts/claims-disputes.md` | ✅ |
| FR11 | Downloadable / copyable checklist | `src/components/ChecklistView.tsx` — copy-to-clipboard and download-as-`.txt` | ✅ |
| FR12 | Feedback capture (no account) | Removed — no database at this stage; deferred to a later phase | ➖ |
| FR13 | Source & disclaimer page | `src/app/about/page.tsx` (about + privacy), `src/components/Disclaimer.tsx` on every screen | ✅ |

## Non-Functional Requirements

| ID | Requirement | Implemented in | Status |
|----|-------------|----------------|--------|
| NFR1 | Usability (mobile, plain language) | Mobile-first CSS (`src/styles/`), `docs/STYLING_GUIDE.md`, 44px tap targets, plain-language copy | ✅ |
| NFR2 | Performance | Static prerendering of all content pages + scenario pages (build output: 21 routes, scenario pages SSG); light client JS (~100kB first load) | ✅ |
| NFR3 | Reliability (never blank/broken) | `safeParseChecklist` fallback in `src/lib/ai/index.ts` + try/catch fallback in `src/app/api/navigate/route.ts` | ✅ |
| NFR4 | Safety | Deterministic emergency layer + output validator (`src/lib/safety/*`); safety never depends on the AI | ✅ |
| NFR5 | Privacy (POPIA-aware) | Data minimisation, no member/ID numbers, `content/core/privacy-principles.md`, `docs/SECURITY.md` | ✅ |
| NFR6 | Security | Rate limiting + input sanitisation (`src/lib/safety/guards.ts`), security headers (`next.config.mjs`) | ✅ (see SECURITY.md prod note on rate limiter) |
| NFR7 | Maintainability | Content separated from code in `/content` + `/src/data`; provider-agnostic AI layer; documented | ✅ |
| NFR8 | Compliance awareness | System prompt guardrails (`content/prompts/system-prompt.md`), output validator, disclaimers, scheme-neutral stance | ✅ |

## Spec endpoints (section 26.3)

| Endpoint | Route file | Status |
|----------|-----------|--------|
| `POST /api/navigate` | `src/app/api/navigate/route.ts` | ✅ |
| `POST /api/classify-scenario` | `src/app/api/classify-scenario/route.ts` | ✅ |
| `GET /api/health` | `src/app/api/health/route.ts` | ✅ |

## Open questions (section 33) — resolved for v1

| Question | Decision |
|----------|----------|
| Scheme-specific vs neutral | **Scheme-neutral** (lower legal risk, broader appeal) |
| Stateful vs stateless | **Stateless** — nothing stored about the user's situation |
| Claim document upload | **Deferred** past MVP |
| Legal review timing | Before public **promotion**, not before build |
| Product name | Keep **Medical Aid Navigator** (descriptive, fine for MVP) |
| AI provider | **Anthropic default** (`claude-sonnet-4-6` unless overridden), OpenAI swappable with `AI_PROVIDER=openai` |

## Notable gaps / follow-ups

- Rate limiter is in-memory (MVP, with expired-entry sweeping). Move to Upstash/Vercel KV before launch — see `docs/SECURITY.md`.
- Scheme-specific knowledge intentionally omitted; add later only with dated, reviewed sources.
- Safety-critical unit tests cover `emergency.ts`, `outputValidator.ts`, and request validation.
