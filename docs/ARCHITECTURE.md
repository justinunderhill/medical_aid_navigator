# Architecture

## Principle: safety does not depend on the AI

The single most important design decision. A person in a medical emergency must
get correct guidance even if the AI provider is down, slow, rate-limited, or
manipulated by injected input.

So **emergency detection is deterministic** (`src/lib/safety/emergency.ts`):
keyword + scenario + structured-flag matching, no network call. It is allowed to
over-trigger (false positives are cheap) but must never miss a real emergency.

## Request pipeline (`POST /api/navigate`)

```
request
  │
  ▼
[rate limit]  ── too many ─▶ 429
  │
  ▼
[detectEmergency()]  ── emergency ─▶ static EMERGENCY_GUIDANCE  (no AI)
  │ (not emergency)
  ▼
[load grounded knowledge from /content]
  │
  ▼
[AI provider .generate()  — Anthropic default / OpenAI swap]
  │
  ▼
[parse JSON]  ── parse fails ─▶ safe fallback checklist  (NFR3)
  │
  ▼
[validateOutput() on every field]  — softens forbidden phrasing, flags it
  │
  ▼
[append STANDARD_DISCLAIMER]
  │
  ▼
response
```

## Layers

### AI layer (`src/lib/ai`)
Provider-agnostic behind an `AIProvider` interface. `getProvider()` reads
`AI_PROVIDER`. Anthropic is the operative default (`ANTHROPIC_API_KEY`,
`ANTHROPIC_MODEL`, default model `claude-sonnet-4-6`) because it adheres more
reliably to the refusal/guardrail instructions that protect us from claim
guarantees and medical advice. OpenAI remains available by setting
`AI_PROVIDER=openai` and `OPENAI_API_KEY`; the rest of the app never knows which
provider is active.

### Knowledge layer (`src/lib/knowledge`)
Reads `/content` markdown and feeds it to the AI as the *only* permitted source
of scheme rules. The system prompt forbids inventing rules. This is how we
control hallucination — the AI explains and questions, it does not fabricate
plan specifics.

### Safety layer (`src/lib/safety`)
- `emergency.ts` — deterministic emergency detection + canonical copy.
- `outputValidator.ts` — post-generation phrase filter (claim guarantees,
  diagnosis, broker advice, scheme-blaming) with auto-softening.
- `guards.ts` — rate limiting, input sanitisation, prompt-injection wrapping.

### Data layer (`src/data`)
Typed scenario and concept definitions. Content is separated from code (NFR7)
so flows and explainers can be edited without touching logic.

## Why scheme-neutral

We do not encode plan-specific benefit limits or formularies for any named
scheme. They change yearly, vary by plan, and can't be reliably guaranteed from
public info. Encoding them creates accuracy and legal risk. Instead we teach the
*right questions to ask your own scheme*. Discovery is left as a neutral
placeholder (`content/schemes/discovery-general.md`).

## Statelessness

v1 stores nothing about the user's situation. The only persisted data is
optional, anonymous feedback. No accounts, no member numbers, no ID numbers
(POPIA-aware, NFR5).
