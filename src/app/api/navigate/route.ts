import { NextRequest, NextResponse } from 'next/server';
import { generateChecklist } from '@/lib/ai';
import type { NavigateRequest } from '@/lib/ai/types';
import {
  detectEmergency,
  EMERGENCY_GUIDANCE,
  FALLBACK_URGENT_CARE_LEAD,
} from '@/lib/safety/emergency';
import { rateLimit, clientKey } from '@/lib/safety/guards';
import { parseNavigateRequestBody } from '@/lib/safety/requestValidation';
import { getScenario } from '@/data/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/navigate
 * The primary endpoint. Runs:
 *   1. rate limit
 *   2. deterministic emergency check (returns emergency payload fast)
 *   3. AI checklist generation (with grounding + output validation)
 */
export async function POST(req: NextRequest) {
  // 1. Rate limit
  const key = clientKey(req.headers);
  const limit = rateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  let body: NavigateRequest;
  try {
    const parsed = parseNavigateRequestBody(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    body = parsed.value;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const scenarioId = body.scenarioId;
  if (!scenarioId || !getScenario(scenarioId)) {
    return NextResponse.json({ error: 'Unknown scenario.' }, { status: 400 });
  }

  const freeText = body.freeText;
  const answers = body.answers ?? {};

  // 2. Fast emergency response (do not wait on the AI).
  const emergency = detectEmergency({ scenarioId, freeText, answers });

  if (emergency.isEmergency) {
    return NextResponse.json({
      isEmergency: true,
      emergency: EMERGENCY_GUIDANCE,
    });
  }

  // 3. AI generation with full pipeline.
  try {
    const checklist = await generateChecklist({
      scenarioId,
      freeText,
      answers,
      schemeName: body.schemeName,
      planName: body.planName,
    });
    const { _validationFlags, ...publicChecklist } = checklist;
    if (_validationFlags?.length) {
      console.warn('[navigate] output validation flags:', _validationFlags);
    }
    return NextResponse.json({ isEmergency: false, checklist: publicChecklist });
  } catch (err) {
    // NFR3: never show broken/blank guidance. Return a safe fallback.
    console.error('[navigate] generation error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        isEmergency: false,
        checklist: null,
        fallback: true,
        message:
          `${FALLBACK_URGENT_CARE_LEAD}\n\nOtherwise, we could not generate detailed guidance right now. Please contact your medical scheme directly, and keep all documents and ICD-10 codes for your situation.`,
      },
      { status: 200 }
    );
  }
}
