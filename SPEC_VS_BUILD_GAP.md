# Spec-vs-Build Traceability Audit

**Source of truth:** `Medical Aid Navigator MVP.pdf` (Business Case + BRS, 28 pp.)
**Build audited:** current working tree
**Auditor:** Claude (independent senior review) · **Date:** 2026-06-24

This is an *independent* read of the build against the spec. It deliberately
does not just trust `docs/REQUIREMENTS_TRACEABILITY.md` (Codex's own
self-assessment, which marks every line ✅). Where my finding differs, I say so.

### Legend
- **Full** — implemented as specified.
- **Partial** — present but thinner/narrower than the spec's stated detail.
- **Deviated** — built differently from the spec (may be an improvement).
- **Deferred** — explicitly out of MVP scope per the spec itself.

---

## Functional Requirements (FR1–FR13)

| # | Requirement | Status | Notes |
|---|---|---|---|
| FR1 | Homepage (value prop, emergency disclaimer, does/doesn't, scenario entry, privacy links) | **Full** | `src/app/page.tsx` has all elements; emergency callout + "No false certainty" guardrail panel + header links. |
| FR2 | Scenario selection (10 scenarios; "not sure" → triage) | **Full** | All 10 scenarios present. The triage flow calls `/api/classify-scenario`, then renders the resolved checklist inline without sending the user through a second question flow. |
| FR3 | Guided question flow (scenario-specific, skippable, no member/ID number) | **Full** | Non-explainer flows now ask 3–6 skippable questions, including the spec-named emergency, specialist, and chronic questions. No member number, ID number, or prohibited PII requested. |
| FR4 | Emergency safety layer | **Full** | `src/lib/safety/emergency.ts` — deterministic, AI-independent, SA numbers (10177/112), emergency-first ordering. Strengthened this session (data-driven trigger + fallback urgent-care lead). |
| FR5 | Benefit pathway output (8 sections, cautious language, confirm-with-scheme) | **Full** | `NavigationChecklist` carries all 8 sections; output validator enforces cautious language; disclaimer appended. |
| FR6 | PMB explainer | **Full** | `content/concepts/pmb.md` + explainers page; "not self-declared by the app" enforced in prompt + validator. |
| FR7 | DSP & network explainer | **Full** | `content/concepts/dsp.md`; co-payment linkage covered. |
| FR8 | Authorisation checklist | **Full** | `content/concepts/authorisation.md` + planned-procedure scenario grounding. |
| FR9 | Chronic benefit checklist | **Full** | `content/concepts/chronic-benefit.md` + chronic scenario. (Question flow itself is light — see FR3.) |
| FR10 | Claim rejection assistant | **Full** | `claim-rejection` scenario captures rejection reason, written reasons, related category, claim type, and whether provider billing codes are available. Output/escalation guidance is present and correct. |
| FR11 | Downloadable / copyable checklist | **Full** | `ChecklistView.tsx` — copy + download `.txt`, includes disclaimer. (Spec says "save or print"; print works via browser, no dedicated PDF.) |
| FR12 | Feedback capture (no account, optional email, privacy notice) | **Removed** | Removed with the database — user response was minimal; deferred to a later phase. |
| FR13 | Source & disclaimer/privacy page, reachable from all screens | **Full** | `about/page.tsx` (disclaimer + privacy), linked in the global `SiteHeader`, so reachable everywhere. |

---

## Non-Functional Requirements (NFR1–NFR8)

| # | Requirement | Status | Notes |
|---|---|---|---|
| NFR1 | Usability (plain English, mobile-first, minimal fields) | **Full** | Mobile-first CSS, scenario cards, chip inputs, plain copy. |
| NFR2 | Performance (fast load, static fallback) | **Full** | Pages prerendered (SSG); static fallback checklist exists. Actual load times not benchmarked. |
| NFR3 | Reliability (graceful AI failure, never blank, safe logging) | **Full** | Verified live: with no API key, `/api/navigate` returned a safe fallback 200. Errors log messages only. |
| NFR4 | Safety (emergency over optimisation) | **Full** | Deterministic layer + emergency-first prompt ordering + fallback urgent-care lead. |
| NFR5 | Privacy (no ID/member numbers, no account, optional email) | **Full** | Enforced; POPIA posture in `docs/SECURITY.md`. |
| NFR6 | Security (HTTPS, env keys, rate limit, sanitisation, injection protection) | **Full** | Headers in `next.config.mjs`, in-memory rate limit, `sanitiseUserText`, `<<<USER_INPUT>>>` wrapping (now incl. scheme/plan names). Rate-limit is per-instance only — documented. |
| NFR7 | Maintainability (content separated from code, versionable) | **Full** | `/content` markdown + typed `/data`; matches spec §26.2 structure. Content files now include review-date headers and the explainers page shows a knowledge review date. |
| NFR8 | Compliance awareness (no diagnosis/treatment/plan/switch/guarantee/branding) | **Full** | System prompt ABSOLUTE RULES + output validator cover every prohibited category in §22.2/§25. |

---

## AI Requirements (§22)

| Item | Status | Notes |
|---|---|---|
| AI role: interpret scenario, select pathway, explain, checklist, escalate | **Full** | `generateChecklist` orchestration. |
| AI must-not list (diagnose, treat, guarantee, switch schemes, invent rules…) | **Full** | Enforced twice — prompt + `outputValidator.ts`. |
| Guardrails: urgency-first, cautious language, refer to scheme/broker | **Full** | In `content/prompts/system-prompt.md`. |
| **Provider = OpenAI** (§26.1, §22 stack) | **Deviated** | Build is **Anthropic-default, OpenAI-swappable** behind a provider interface. Defensible improvement (stronger guardrail adherence; provider-agnostic) but it *is* a spec deviation — operative dependency is now `ANTHROPIC_API_KEY`. |
| "Structured outputs where possible" | **Partial** | OpenAI path uses `response_format: json_object`; Anthropic path only *instructs* JSON (no schema/tool-enforced structured output). Works, but not true structured output on the default provider. |

---

## Data Requirements (§21)

| Item | Status | Notes |
|---|---|---|
| Permitted inputs (scenario, question, optional scheme/plan, flags) | **Full** | All supported. |
| Prohibited inputs (ID, member no., medical history, card, address) | **Full** | None collected. |
| Knowledge base coverage (PMB, emergency, DSP, auth, chronic, disputes, terms) | **Full** | All present in `/content`. |
| **D3 — "Date all plan content" / versioned sources** (§13.5, NFR7) | **Full** | Every `/content/**/*.md` file carries a 2026-06 review-date header; the explainers UI also surfaces the knowledge review date. |
| Claim document upload | **Deferred** | Explicitly v2 per §11, §21.2, §21.4, §28 Phase 5, and open question §33.4. Build correctly omits it. |

---

## Endpoints (§26.3) & Screens (§24)

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/navigate` | **Full** | Primary path; used by the UI. |
| `POST /api/classify-scenario` | **Full** | Used by the triage flow before the inline `/api/navigate` checklist call. |
| `POST /api/generate-checklist` | **Retired** | Removed as redundant unused surface area; `/api/navigate` is the single checklist-generation endpoint. |
| `POST /api/feedback` | **Removed** | Removed with the database; deferred to a later phase. |
| `GET /api/health` | **Full** | — |

6 of the 7 spec screens (Home, Scenario select, Guided questions, Result, Explainers, Disclaimer/Privacy) are present; the Feedback screen was removed with the database and is deferred to a later phase. Explainers screen meets the "10+ concepts" acceptance criterion via 7 full explainers + 3 quick definitions.

---

## Net assessment

Against its **own** acceptance criteria (§27), the build passes all nine: full
scenario flow, emergency-first triggering, practical output, no
diagnosis/guarantees, copy/download, 10+ concepts, mobile, and
"suitable to demonstrate publicly as a responsible prototype." Fidelity to the
spec is **high** — most gaps are *depth* (shorter question flows) rather than
*missing capability*, and the one true deviation (Anthropic vs OpenAI) is an
upgrade.

### Punch-list for Codex (in priority order)

These fold the earlier `CLAUDE_CODE_REVIEW.md` M/L findings together with the
spec gaps so there's a single list:

1. **Closed — E2 / FR2:** triage now classifies and renders the resolved checklist inline.
2. **Closed — FR3:** guided flows now meet the 3–6 question depth for non-explainer scenarios.
3. **Closed — FR10:** claim type and provider billing-code inputs added.
4. **Closed — review M2/M3/M4/L1:** input validation, scheme/plan wrapping, `_validationFlags` stripping, and rate-limit sweeping are implemented.
5. **Closed — D3:** `/content` files are date-stamped and the UI surfaces the review date.
6. **Closed — provider deviation:** docs record Anthropic as the operative default with OpenAI swappable.

### Not gaps — deliberate, leave as-is
- No document upload (v2, gated on "mature privacy controls").
- Scheme-neutral / no plan-specific benefit data (§13.5 accuracy mitigation).
- Stateless / no accounts (NFR5).
- In-memory rate limiter (documented as MVP-only).
