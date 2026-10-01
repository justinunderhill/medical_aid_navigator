import { NextRequest, NextResponse } from 'next/server';
import { answerConcierge } from '@/lib/concierge/answer';
import { parseHistory } from '@/lib/concierge/shared';
import { clientKey, rateLimit } from '@/lib/safety/guards';
import { detectEmergency, EMERGENCY_GUIDANCE } from '@/lib/safety/emergency';
import { MAX_PLAN_BYTES, validatePlanUpload } from '@/lib/plan/validate';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limit = rateLimit(`concierge:${clientKey(req.headers)}`, 10);
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!limit.allowed) return NextResponse.json({ error: 'Please wait a moment before asking again.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' } });
  // Bound the actual stream too: Content-Length is optional and untrusted.
  const maxBytes = MAX_PLAN_BYTES + 64000;
  let form: FormData;
  try {
    if (!req.body || Number(req.headers.get('content-length')) > maxBytes) return json({ error: 'Request too large. PDF limit: 4 MB.' }, 413);
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { await reader.cancel(); return json({ error: 'Request too large. PDF limit: 4 MB.' }, 413); }
      chunks.push(value);
    }
    form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers.get('content-type') ?? '' } }).formData();
  } catch { return json({ error: 'Invalid upload. Please try again.' }, 400); }
  const question = form.get('question');
  if (typeof question !== 'string' || !question.trim() || question.length > 1500) return json({ error: 'Ask a question of up to 1,500 characters.' }, 400);
  if (detectEmergency({ freeText: question }).isEmergency) {
    return json({ isEmergency: true, segments: [{ text: [EMERGENCY_GUIDANCE.headline, ...EMERGENCY_GUIDANCE.body].join('\n\n'), citations: [] }], links: [] });
  }
  let history;
  try {
    history = parseHistory(String(form.get('history') ?? '[]'));
    if (history.length % 2) throw new Error('Incomplete history');
  } catch { return json({ error: 'Invalid conversation. Start a new chat and try again.' }, 400); }
  let pdf: Uint8Array | undefined;
  const file = form.get('plan');
  if (file !== null) {
    if (!(file instanceof File)) return json({ error: 'Please choose a PDF.' }, 400);
    const result = validatePlanUpload(new Uint8Array(await file.arrayBuffer()));
    if (!result.ok) return json({ error: result.error }, 400);
    pdf = result.value;
  }
  if (pdf && !process.env.ANTHROPIC_API_KEY) return json({ error: 'Plan reading is not configured yet. Please ask a general question without the PDF, or try again later.' }, 503);
  try {
    const answer = await answerConcierge(question.trim(), history, pdf);
    return json(answer);
  } catch (error) {
    // Never log questions, documents, or provider error payloads.
    console.error('[concierge] generation failure:', error instanceof SyntaxError ? 'invalid-json' : 'provider-or-output-error');
    return json({ error: pdf ? 'MAN could not read your plan right now. Try again, or use an unlocked PDF of the benefit pages (up to 100 pages).' : 'MAN is temporarily unavailable. Please try again, or use the guided tools below.' }, 503);
  }
}
