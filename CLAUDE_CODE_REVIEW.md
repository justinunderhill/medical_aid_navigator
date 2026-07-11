# Senior Dev Review — Medical Aid Navigator MVP

**Reviewer:** Claude (senior dev pass over Codex's MVP)
**Date:** 2026-06-24
**Verdict:** Solid, well-structured MVP with a genuinely good safety-first architecture. It builds, typechecks, and lints clean. There are **no blocking bugs**, but there are a few **safety-relevant gaps** I would want closed before this goes in front of real members — most importantly the complete absence of automated tests on the safety layer, and a couple of places where the "safety doesn't depend on the AI" promise has thinner coverage than the docs imply.

---

## How I verified

| Check | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✅ clean |
| `npm run lint` (`next lint`) | ✅ no warnings or errors |
| `npm run build` (production) | ✅ compiles, 22 pages generated |
| Dev-server smoke test (from `dev-server.log`) | ✅ `POST /api/navigate 200` — fallback path fired correctly with no API key |
| Reviewed: all API routes, AI layer, safety layer, knowledge loader, data, components, configs, docs | — |

The fallback behaviour is real and works: with no `ANTHROPIC_API_KEY`, the navigate endpoint logged the error and still returned a 200 with safe guidance. That's the NFR3 ("never blank/broken") promise holding up under test.

---

## What's genuinely good

- **The core safety principle is correctly implemented.** `detectEmergency()` (`src/lib/safety/emergency.ts`) is deterministic, network-free, and runs *before* and *independently of* the AI in `/api/navigate`. The emergency copy is static with correct SA numbers (10177 / 112). This is the right architecture.
- **Defense in depth on output.** Every string field of the generated checklist is run through `validateOutput()`, which softens claim guarantees, diagnosis, broker advice, PMB self-declaration, and scheme-blaming — regardless of how it arose. Belt-and-braces beyond the prompt, as intended.
- **Graceful degradation everywhere.** AI down → safe fallback checklist. JSON parse failure → fallback. Clipboard blocked → download still works.
- **Privacy/POPIA posture is sound.** No member/ID numbers, no database or persisted data, secrets gitignored. Security headers set in `next.config.mjs`.
- **Clean separation of content from code** (NFR7) — scenarios as typed data, knowledge as editable markdown, prompts in `/content/prompts`.
- Documentation (ARCHITECTURE, SECURITY, REQUIREMENTS_TRACEABILITY) is unusually thorough and **matches the code** where I spot-checked it.

---

## Findings

### HIGH

> **Update 2026-06-24 — H1, H2, H3 fixed.** A Vitest suite now covers the safety
> layer (25 tests passing); emergency triggering is data-driven off the
> `emergencyTrigger` flag; and all fallback paths lead with a static urgent-care
> line. `typecheck`, `lint`, `build`, and `test` all green. Details inline below.

**H1 — Zero automated tests on safety-critical logic.** ✅ **FIXED**
Added Vitest (`npm test`) with `src/lib/safety/emergency.test.ts` (16 tests) and
`src/lib/safety/outputValidator.test.ts` (9 tests) — emergency recall on known
phrases/flags, the new data-driven trigger, non-over-triggering, and every
output-softening rule. 25/25 passing.

---

_Original finding:_
There is no test framework, no test files, nothing. For an app whose entire thesis is *"safety must not depend on the AI,"* the two modules that embody that thesis — `emergency.ts` (emergency detection) and `outputValidator.ts` (forbidden-phrase softening) — have **no regression protection at all**. These are pure, deterministic functions; they are the cheapest possible things to unit-test and the most expensive to get silently wrong. A future content edit or refactor could weaken emergency recall or break a softening rule and nothing would catch it.
**Recommend:** add Vitest with a focused suite — known emergency phrases must trigger, known forbidden outputs must be softened, parse-failure returns the fallback shape. This is the single highest-value thing to add.

**H2 — The `emergencyTrigger` data flag is dead; emergency detection is hardcoded to a magic string.** ✅ **FIXED**
`detectEmergency` now takes the full `answers` object and escalates when *any*
question marked `emergencyTrigger: true` in the scenario data is answered
affirmatively (`emergency.ts`), replacing the hard-coded `severeSymptoms` key.
Both callers (`navigate/route.ts`, `ai/index.ts`) updated. Content editors can
now add emergency questions as data without losing escalation.

---

_Original finding:_
`Question.emergencyTrigger` exists in the data model (`src/data/scenarios/index.ts`) and is set `true` on two questions — but **no code ever reads it**. Emergency triggering relies entirely on the server checking the hardcoded answer key `severeSymptoms` (`navigate/route.ts:49`, `ai/index.ts:85`). The README invites non-developers to edit scenarios as data. If someone adds an `emergencyTrigger: true` question with any other `id`, it will silently fail to escalate — a false negative, the one failure mode this system is explicitly built to avoid.
**Recommend:** drive the flag from data — detect emergency by scanning answers for *any* question whose `emergencyTrigger` is true, rather than matching the literal string `severeSymptoms`.

**H3 — Residual false-negative gap when keyword detection misses *and* the AI is unavailable.** ✅ **FIXED**
Added `FALLBACK_URGENT_CARE_LEAD` and applied it so every fallback path (the
parse-failure checklist in `ai/index.ts` and the catch handler in
`navigate/route.ts`) now leads with a static "if symptoms are severe, get care
now — call 10177/112" line, since a fallback can't know it isn't an emergency.
Documented as a known residual risk in `docs/SECURITY.md` (§3a), including the
English-only keyword limitation and the pre-launch action to broaden terms.

---

_Original finding:_
The emergency term list is English-only substring matching. South Africa is multilingual, and common real phrasings slip through: *"my chest really hurts"* (no `chest pain`), *"can't catch my breath"* (no listed term), Afrikaans/isiZulu/etc. entirely. That's an acceptable limitation **as long as the AI backstops it** — but when the AI is down, the fallback checklist (`safeParseChecklist` catch and the route catch) is a **generic, non-urgent benefit checklist with no urgent-care escalation**. So: missed keyword + AI outage = a person in an emergency gets routine benefit guidance.
**Recommend:** (a) document this explicitly as a known residual risk in SECURITY.md; (b) consider having the *fallback* path always lead with a brief "if symptoms are severe, seek care now" line, since the fallback can't know it isn't an emergency; (c) optionally broaden the term list with local-language red-flag terms.

### MEDIUM

**M1 — Two API endpoints are dead code, and the triage UX is not what the docs describe.**
`/api/classify-scenario` and `/api/generate-checklist` are fully built but **never called by the frontend** (confirmed by grep — `ScenarioFlow` only calls `/api/navigate`). The "I'm not sure what to do" triage scenario is documented to classify free text into a scenario, but it actually just POSTs `scenarioId: 'triage'` to `/api/navigate` and gets a generic checklist — the classification step is never wired in.
**Recommend:** either wire `classify-scenario` into the triage flow (the intended UX) or delete both unused routes so they aren't an unmaintained, untested attack surface.

**M2 — `schemeName` / `planName` are injected into the prompt without injection-wrapping.**
Free text is correctly wrapped in `<<<USER_INPUT>>>` delimiters, but `schemeName` and `planName` are interpolated raw into the prompt (`ai/index.ts:117-118`). They're length-capped (80) and control-char-stripped, so the blast radius is small, but they're still user-controlled strings treated as instructions, not data.
**Recommend:** run them through `wrapUserContent()` too, or at minimum label them as untrusted data in the prompt.

**M3 — Internal `_validationFlags` are leaked to the client.**
`validateChecklistFields` attaches `_validationFlags` (which forbidden patterns the model tripped) to the checklist object, and the route returns the whole object to the browser. Not sensitive, but it exposes internal safety logic and the fact that the model attempted forbidden phrasing.
**Recommend:** strip `_validationFlags` (and ideally log them server-side for the monitoring the SECURITY.md pre-launch checklist already calls for) before sending the response.

**M4 — Rate-limiter map grows unbounded.**
`hits` (`guards.ts`) never evicts expired entries — it only resets a key when that same key is seen again. On a long-lived instance this leaks memory, and the bucket is shared across all endpoints. SECURITY.md already flags the limiter as MVP-only and per-instance, but not the unbounded growth.
**Recommend:** sweep expired entries (or note it alongside the existing "move to Upstash/KV" item).

### LOW / POLISH

- **L1 — No request-body schema validation.** Routes cast `await req.json()` straight to `NavigateRequest` and lean on `sanitiseUserText`. `answers` is typed `Record<string, string | boolean>` but multi-select questions actually send `string[]` (it stringifies harmlessly, but the type is a lie). A small zod schema per route would tighten this.
- **L2 — Output softening can read awkwardly.** `/\bguarantee(d|s)?\b/` → "cannot be guaranteed; please confirm" can produce broken grammar (e.g. "we guarantee cover" → "we cannot be guaranteed; please confirm cover"). Safe, but clunky; fine for MVP.
- **L3 — Inconsistent emergency response shapes.** `/api/navigate` returns `{ isEmergency, emergency }`; `generateChecklist` returns a full `NavigationChecklist` with `isEmergency: true`. Only the frontend's actual path is consistent, but the two contracts diverge.
- **L4 — `.env.example` copy-paste slip.** The `RATE_LIMIT_PER_MINUTE` comment says "Comma-separated" — it's a single integer.
- **L5 — `maxDuration = 30`** exceeds the default limit on Vercel Hobby; confirm the deployment tier supports it.

---

## Suggested priority order

1. **H1** — add a Vitest suite over `emergency.ts` and `outputValidator.ts` (highest value, lowest effort).
2. **H2** — make emergency detection read the `emergencyTrigger` flag from data instead of a magic string.
3. **H3** — make the AI-down fallback lead with an urgent-care line, and document the residual gap.
4. **M1** — wire up or delete the two orphaned endpoints.
5. **M2, M3** — wrap scheme/plan inputs; strip `_validationFlags` from responses.
6. Everything else as cleanup.

None of these block a closed beta. **H1–H3 should be closed before any public, unsupervised launch**, because they're the difference between the safety story being *designed* and being *guaranteed*.
