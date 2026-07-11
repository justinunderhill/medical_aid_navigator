# Build Plan

The foundation in this repo is **phase 0 — complete and building**. This is the
suggested path from here.

## Phase 0 — Foundation (done)

- Full Next.js App Router project, typechecks and builds cleanly.
- Safety-first pipeline: deterministic emergency layer + output validation.
- Provider-agnostic AI layer (Anthropic default, OpenAI swap).
- All 10 scenarios, 10+ explainer concepts, and the active API endpoints.
- Complete styling system and accessible UI for all 7 screens.
- Docs: README, architecture, styling guide, security, traceability.

## Phase 1 — Make it live (you, in VS Code)

1. `npm install`, add API keys to `.env.local`, `npm run dev`.
2. Walk every scenario end-to-end with a real API key and read the output
   critically — this is where you tune the system prompt and knowledge files.
3. Adjust tone/wording in `content/prompts/system-prompt.md` and the
   `content/**` knowledge to match how you want it to sound.

## Phase 2 — Harden before any public traffic

1. **Rate limiting** → Upstash Redis or Vercel KV (see `docs/SECURITY.md`).
2. **Monitoring** on output-validator hard flags (model trying to overstep).
3. **Legal/compliance review** of all user-facing copy and disclaimers.

## Phase 3 — Validate with real users

1. Deploy to Vercel (private/beta).
2. Gather signal on clarity and gaps from real users.
3. Prioritise the next scenarios/explainers from real questions, not guesses.

## Phase 4 — Considered expansion (only if validated)

- Scheme-specific knowledge — **only** with dated, official, reviewed sources
  and clear versioning. This is the highest-risk addition; gate it behind
  compliance review.
- Claim-document upload (deferred from MVP) — significant POPIA implications;
  design storage and consent carefully first.

## Guardrails to never regress

- Emergency detection must stay deterministic and AI-independent.
- The output validator must run on every generated field.
- Every result must carry the disclaimer.
- No member numbers / ID numbers collected without a deliberate, reviewed
  privacy decision.
