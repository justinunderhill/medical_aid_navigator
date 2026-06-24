# Codex Punch-List — Action Brief

**For:** Codex (cold start — read this top to bottom; do not assume prior context)
**From:** Claude (senior review) · **Date:** 2026-06-24
**Project:** Medical Aid Navigator MVP (Next.js App Router, TypeScript, `/content` markdown KB, Anthropic-default AI behind a provider interface)

## Context in one paragraph
You built this MVP from `Medical Aid Navigator MVP.pdf` (Business Case + BRS).
It has since had a senior code review (`CLAUDE_CODE_REVIEW.md`) and a spec-vs-build
audit (`SPEC_VS_BUILD_GAP.md`). The three HIGH review findings (H1 tests, H2
data-driven emergency trigger, H3 fallback urgent-care lead) are **already fixed**.
Several MEDIUM/LOW items are **also already done** (see "Do NOT redo"). This brief
is the remaining, prioritised work. Action items in order; each is independently
shippable.

## Ground rules (apply to every task)
- **Do not weaken the safety layer.** `src/lib/safety/emergency.ts` must stay
  deterministic and AI-independent. Emergency detection must keep running before
  any AI call. When in doubt, escalate (false positives are acceptable).
- **Stay scheme-neutral.** Do not encode plan-specific benefit limits, prices,
  formularies, or named-scheme rules. The app teaches members what to ask.
- **Keep the guardrails.** No diagnosis, no claim guarantees, no broker/scheme-switching
  advice. The output validator (`src/lib/safety/outputValidator.ts`) and system
  prompt enforce this — extend, don't bypass.
- **Add/maintain tests** for any logic you change. Test runner is Vitest.
- **Definition of done for every task:** `npm run typecheck`, `npm run lint`,
  `npm test`, and `npm run build` all pass. (If `build` throws a webpack
  `a[d] is not a function` prerender error, it's a stale cache — `rm -rf .next`
  and rebuild; it is not your code.)

## Do NOT redo (already completed since the review)
- H1 — Vitest suite exists (`src/lib/safety/*.test.ts`, 25 tests).
- H2 — `detectEmergency` is data-driven off `Question.emergencyTrigger`.
- H3 — `FALLBACK_URGENT_CARE_LEAD` leads all fallback paths.
- M2 — `schemeName`/`planName` are wrapped via `wrapUserContent` in `src/lib/ai/index.ts`.
- M3 — `_validationFlags` is stripped from the API response in `navigate/route.ts` (logged server-side).
- M4 — rate limiter sweeps expired entries (`src/lib/safety/guards.ts`).
- L1 — request bodies validated via `src/lib/safety/requestValidation.ts`.

---

## TASK 1 — Wire `classify-scenario` into the triage flow  ⭐ highest priority
**Why:** Spec FR2 says *"'I'm not sure what to do' routes the user to a general
triage flow."* Today the triage scenario just POSTs `scenarioId: 'triage'` to
`/api/navigate` and returns a **generic** checklist — it never classifies. The
endpoint to fix this already exists and works; it's just not called.

**Relevant files:**
- `src/components/ScenarioFlow.tsx` — the client flow (the only place that needs changing).
- `src/app/api/classify-scenario/route.ts` — **already complete**; do not change its logic. It: (a) runs deterministic emergency detection first, (b) asks the AI to map free text to one of the non-emergency scenario ids or `"triage"`, (c) returns `{ isEmergency, scenarioId, emergency? }`.
- `src/data/scenarios/index.ts` — the `triage` scenario has `isTriage: true`, a `severeSymptoms` boolean (`emergencyTrigger: true`), and a `situation` free-text question.

**Required behaviour — generate the checklist INLINE (do not route the user to another page or question flow):**
1. When the active scenario `isTriage`, on submit, FIRST call `POST /api/classify-scenario` with `{ text: <the "situation" free text> }`.
2. If the response has `isEmergency: true`, render the emergency banner inline (same as today's emergency path) and stop.
3. Otherwise take the returned `scenarioId` and **immediately** call `POST /api/navigate` with **that resolved `scenarioId`** and the **full `answers` object** the user already gave (so the `severeSymptoms` emergency flag is still evaluated server-side — keep this safety net). Render the resulting checklist **on the same triage result view**. The user must NOT be redirected to `/scenario/{id}` or asked a second round of questions — classification happens silently and the checklist appears in place.
4. If classification returns `"triage"` (model unsure) or the classify call fails, fall back to today's behaviour (navigate with `scenarioId: 'triage'`). Never dead-end the user.

**Implementation note:** This is a two-call sequence inside the existing triage `submit()` in `ScenarioFlow.tsx` (classify → navigate), with the loading state held across both calls. No router navigation, no new page.

**Safety note:** Do not remove the existing `severeSymptoms`/`answers` path — emergency must still trigger even if the user typed nothing classifiable.

**Acceptance criteria:**
- Triage free text like *"my claim was rejected"* produces a checklist **grounded in the claim-rejection scenario, shown inline**, not a generic triage checklist — and without navigating away.
- Triage text describing severe symptoms (e.g. *"chest pain"*) shows the emergency banner inline.
- Empty/ambiguous triage input still produces a safe checklist inline (no crash, no blank screen).
- The user is never sent through a second question flow; the result replaces the triage questions in place.
- Non-triage scenarios are unchanged.

---

## TASK 2 — Deepen the guided question flows (FR3)
**Why:** Spec FR3 / §23.1 expects **3–6** scenario-specific questions; several
flows ask fewer and omit questions the spec names. Richer answers → better,
safer grounding for the checklist.

**File:** `src/data/scenarios/index.ts` (data only — no logic change needed; the
flow renderer already handles `single`/`multi`/`text`/`boolean`).

**Add at least these spec-named questions (keep them `optional: true`, skippable):**
- `emergency-care` / `casualty`: "Is the person conscious and breathing normally?" (boolean). For casualty, a "No" should behave as a severe-symptom signal — set `emergencyTrigger: true` on it (the detector is now data-driven, so this Just Works; add a test — see below).
- `specialist-referral`: "Do you have the procedure codes or a motivation letter?" (single: Yes / No / Not sure).
- `chronic-condition`: "Has the scheme approved chronic cover yet?" (boolean) and "Is a DSP pharmacy required?" (single: Yes / No / Not sure).

**Acceptance criteria:**
- Each non-explainer scenario asks 3–6 questions.
- All new questions are skippable and request **no** member number, ID number, or other prohibited PII (spec §21.2).
- Add a Vitest case in `src/lib/safety/emergency.test.ts` proving the new casualty `emergencyTrigger` question escalates when answered affirmatively.

---

## TASK 3 — Complete the claim-rejection inputs (FR10)
**Why:** Spec FR10 lists 5 inputs; the build captures 3. Add the two missing.

**File:** `src/data/scenarios/index.ts`, `claim-rejection` scenario.

**Add (optional, skippable):**
- "What type of claim was it?" (single: Hospital / Day-to-day / Chronic / Specialist / Other / Not sure).
- "Do you have the provider's billing codes?" (single: Yes / No / Not sure).

**Acceptance criteria:** both questions appear in the flow and are passed through in `answers`; output guidance still uses cautious language and the dispute-process framing (no encouragement to make unsupported accusations).

---

## TASK 4 — Date-stamp / version the knowledge base (spec §13.5, NFR7)
**Why:** Medical-aid rules change annually; the spec requires content to be dated.
Currently `/content/**` files are undated.

**Approach (low-risk, pick one and be consistent):**
- Add a short front-matter/header line to each `/content/**/*.md`, e.g.
  `_Last reviewed: 2026-06 · Source: <public ref or "scheme-neutral">_`, **and**
- surface a single "Knowledge last reviewed: <date>" line in the explainers page
  footer (`src/app/explainers/page.tsx`) and/or the About page.

**Acceptance criteria:** every content file carries a review date; users can see a
"last reviewed" indicator somewhere in the UI. Do not invent scheme-specific facts
while doing this.

---

## TASK 5 — Resolve the OpenAI-vs-Anthropic spec deviation (documentation)
**Why:** Spec §26.1/§22 say OpenAI; the build is Anthropic-default (a deliberate
upgrade — better guardrail adherence). Spec and build should agree. No code change
unless the owner decides to switch the default (they have indicated Anthropic-default
is preferred).

**Action:** Update `docs/` (and note in `README.md` if needed) to record that the
operative default provider is **Anthropic** (`ANTHROPIC_API_KEY`, model
`claude-sonnet-4-6` by default), with OpenAI available via `AI_PROVIDER=openai`.
Leave the provider-agnostic interface as-is.

**Acceptance criteria:** docs no longer contradict the build on provider choice.

---

## Suggested order & sequencing
1, 2, 3 are the user-visible quality wins (do first — they also improve the
public demo). 4 and 5 are compliance/housekeeping and can follow.

After each task, run the full gate (`typecheck` + `lint` + `test` + `build`) and
keep changes scoped to the files named. If a task needs a decision outside this
brief (e.g. exact question wording), prefer the safer, simpler option and note
the choice in your PR/summary. (Task 1 is settled: generate the checklist inline,
no routing.)
