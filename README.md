# Medical Aid Navigator — MVP

An educational, AI-assisted tool that helps South African medical aid members
understand what to ask, check, and document **before, during, and after** using
their benefits.

> **Not** medical, legal, broker, or financial advice. **Not** a guarantee of any
> claim outcome. Scheme-neutral. Anonymous by default.

---

## Quick start (VS Code)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
#    then edit .env.local and add your keys (see below)

# 3. Run the dev server
npm run dev
#    open http://localhost:3000
```

### Required environment variables

Anthropic is the operative default provider for this MVP. OpenAI remains
available through the same provider interface by setting `AI_PROVIDER=openai`.

| Variable | Needed for | Notes |
|---|---|---|
| `AI_PROVIDER` | choosing AI | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` | AI (default) | from console.anthropic.com |
| `ANTHROPIC_MODEL` | AI | defaults to `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | AI (only if `AI_PROVIDER=openai`) | required only for OpenAI mode |

---

## Scripts

### PWA updates

Every deployment gets a build version shared by the browser, `/api/version`, and
the generated `/sw.js`. Active sessions check for updates every five minutes,
when returning to the foreground, and when reconnecting. Both endpoints bypass
HTTP caching. A new service worker waits until the user chooses **Refresh now**;
**Later** hides the prompt for fifteen minutes. Another tab accepting an update
does not force the current tab to reload. Refreshing clears the in-memory chat,
selected plan, and unfinished guided checks, as explained in the prompt.

Vercel provides the deployment or commit identifier automatically. Local builds
use a generated UUID written once by the prebuild hook and reused on server restart.
No manual service-worker cache version bump is needed. Existing open sessions from
before this feature need one normal refresh to load the update controls.

### MAN concierge

MAN is available on the home page, `/man`, and `/cover`. It answers from the
app's concepts and scenarios, suggests allowlisted navigation links, and accepts
benefits PDFs with page citations. Follow-ups include the last six exchanges.
Chat and the selected document survive in-app navigation in React memory only;
refreshing, clearing chat, or changing the document clears the conversation.
The PDF is sent again for each question; this is document grounding, not model training
or a persistent document index. Nothing is written to a database or browser storage.

General chat uses `AI_PROVIDER`. PDF reading requires `ANTHROPIC_API_KEY`, including
when general chat uses OpenAI. Files are limited to 4 MB; the PDF provider supports
up to 100 pages. MAN has no connection to live scheme balances or claim status.
The `/api/concierge` route validates bounded multipart requests, runs deterministic
emergency detection before AI, and returns uncached responses. Provider errors do
not expose or log chat or document content.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | ESLint |
| `npm test` | Vitest safety and request-validation tests |

---

## How it works (the safety-first pipeline)

A request to `/api/navigate` runs in this order:

1. **Rate limit** (basic per-IP safeguard).
2. **Deterministic emergency detection** — `src/lib/safety/emergency.ts`.
   This runs *before* and *independently of* the AI. If it's an emergency, the
   user gets static, hard-coded urgent-care guidance even if the AI is down.
3. **Grounded AI generation** — the AI is given only our own knowledge base
   (`/content`) and is told not to invent scheme rules.
4. **Output validation** — `src/lib/safety/outputValidator.ts` scans the AI
   output for forbidden phrasing (claim guarantees, diagnosis, broker advice,
   scheme-blaming) and softens it. Belt-and-braces beyond the prompt.
5. **Disclaimer** appended to every result.

See `docs/ARCHITECTURE.md` for the full map and `docs/SECURITY.md` for the
security posture.

---

## Project layout

```
content/            Editable knowledge base (markdown) + AI prompts
src/
  app/              Next.js App Router pages + API routes
  components/       React UI components
  data/             Scenario + concept definitions (typed data)
  lib/
    ai/             Provider-agnostic AI layer (Anthropic default, OpenAI swap)
    knowledge/      Loads /content to ground the AI
    safety/         Emergency detection, output validation, guards
  styles/           Design tokens + global CSS
docs/               Styling guide, architecture, build plan, traceability
```

## Editing content (no code needed)

- **Scenarios & questions:** `src/data/scenarios/index.ts`
- **Concept explainers:** `content/concepts/*.md`
- **AI behaviour:** `content/prompts/system-prompt.md`
- **Emergency keywords:** `src/lib/safety/emergency.ts`

## Deploying

Built for Vercel. Push to a repo, import in Vercel, add the env vars, deploy.
The `/api/*` routes run as serverless functions on the Node.js runtime.
