import { NextRequest, NextResponse } from 'next/server';
import { detectEmergency, EMERGENCY_GUIDANCE } from '@/lib/safety/emergency';
import { rateLimit, clientKey } from '@/lib/safety/guards';
import { STANDARD_DISCLAIMER } from '@/lib/safety/outputValidator';
import { validatePlanUpload, validateQuestion, MAX_PLAN_BYTES } from '@/lib/plan/validate';
import { answerFromPlanDocument } from '@/lib/plan/answer';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/plan-cover  (multipart: `plan` = PDF, `question` = text)
 *
 * Privacy contract (POPIA): the document lives in memory for this request
 * only. It is never written to disk, a database or a log, and neither the
 * document nor the question is included in any error output.
 */
export async function POST(req: NextRequest) {
  // Heavier than /navigate (a whole document per call), so a tighter bucket.
  const limit = rateLimit(`plan:${clientKey(req.headers)}`, 6);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_PLAN_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'That file is larger than 4 MB.' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const question = validateQuestion(form.get('question'));
  if (!question.ok) return NextResponse.json({ error: question.error }, { status: 400 });

  // Safety first, before any document processing and independent of the AI.
  if (detectEmergency({ freeText: question.value }).isEmergency) {
    return NextResponse.json({ isEmergency: true, emergency: EMERGENCY_GUIDANCE });
  }

  const file = form.get('plan');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Please upload your plan document.' }, { status: 400 });
  }
  const upload = validatePlanUpload(new Uint8Array(await file.arrayBuffer()));
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 });

  try {
    const answer = await answerFromPlanDocument(upload.value, question.value);
    if (answer.segments.length === 0) throw new Error('empty answer');
    if (answer.flags.length) console.warn('[plan-cover] output validation flags:', answer.flags);
    return NextResponse.json({
      isEmergency: false,
      segments: answer.segments,
      disclaimer: STANDARD_DISCLAIMER,
    });
  } catch (err) {
    // Log the class of failure only — never document or question content.
    console.error('[plan-cover] generation error:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json(
      {
        error:
          "We couldn't read that document. It may be password-protected, scanned as images only, or over 100 pages. Try a text-based PDF of the benefit pages.",
      },
      { status: 422 }
    );
  }
}
