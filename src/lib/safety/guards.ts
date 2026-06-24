/**
 * Lightweight abuse-prevention helpers (NFR6).
 *
 * NOTE: the in-memory rate limiter is per-server-instance and resets on
 * deploy. It is a basic safeguard for the MVP, NOT a production-grade
 * distributed limiter. For production, move to Upstash/Redis or Vercel
 * KV. Documented in docs/SECURITY.md.
 */

const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20);

const hits = new Map<string, { count: number; resetAt: number }>();
let lastSweepAt = 0;

function sweepExpired(now: number): void {
  if (now - lastSweepAt < WINDOW_MS) return;
  lastSweepAt = now;

  for (const [key, entry] of hits) {
    if (now > entry.resetAt) {
      hits.delete(key);
    }
  }
}

export function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  sweepExpired(now);
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

/** Extract a best-effort client key from request headers. */
export function clientKey(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'anonymous'
  );
}

/**
 * Basic input sanitisation. We do NOT try to be a full prompt-injection
 * firewall here (the system prompt + output validator handle semantics).
 * This trims length and strips control characters.
 */
export function sanitiseUserText(input: unknown, maxLen = 1500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, maxLen)
    .trim();
}

/**
 * Defensive wrapper for free text that will be embedded in a prompt.
 * Wraps user content in clear delimiters and neutralises obvious
 * injection attempts ("ignore previous instructions" style) by noting
 * them rather than executing. The system prompt instructs the model to
 * treat delimited content as data, not instructions.
 */
export function wrapUserContent(text: string): string {
  const clean = sanitiseUserText(text);
  return `<<<USER_INPUT>>>\n${clean}\n<<<END_USER_INPUT>>>`;
}
