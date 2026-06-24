import type { AnswerValue, NavigateRequest } from '@/lib/ai/types';
import { sanitiseUserText } from '@/lib/safety/guards';

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAnswers(value: unknown): ParseResult<Record<string, AnswerValue>> {
  if (value === undefined) return { ok: true, value: {} };
  if (!isRecord(value)) return { ok: false, error: 'Invalid answers.' };

  const answers: Record<string, AnswerValue> = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = sanitiseUserText(rawKey, 64);
    if (!key) return { ok: false, error: 'Invalid answer key.' };

    if (typeof rawValue === 'boolean') {
      answers[key] = rawValue;
    } else if (typeof rawValue === 'string') {
      answers[key] = sanitiseUserText(rawValue, 1000);
    } else if (Array.isArray(rawValue) && rawValue.every((item) => typeof item === 'string')) {
      answers[key] = rawValue.slice(0, 20).map((item) => sanitiseUserText(item, 200));
    } else {
      return { ok: false, error: 'Invalid answer value.' };
    }
  }

  return { ok: true, value: answers };
}

export function parseNavigateRequestBody(body: unknown): ParseResult<NavigateRequest> {
  if (!isRecord(body)) return { ok: false, error: 'Invalid request body.' };

  if (typeof body.scenarioId !== 'string') {
    return { ok: false, error: 'Scenario id is required.' };
  }

  const answers = parseAnswers(body.answers);
  if (!answers.ok) return answers;

  return {
    ok: true,
    value: {
      scenarioId: sanitiseUserText(body.scenarioId, 64),
      freeText: sanitiseUserText(body.freeText, 1500),
      answers: answers.value,
      schemeName: sanitiseUserText(body.schemeName, 80) || undefined,
      planName: sanitiseUserText(body.planName, 80) || undefined,
    },
  };
}

export function parseClassifyScenarioBody(body: unknown): ParseResult<{ text: string }> {
  if (!isRecord(body)) return { ok: false, error: 'Invalid request body.' };
  if (body.text !== undefined && typeof body.text !== 'string') {
    return { ok: false, error: 'Invalid text.' };
  }
  return { ok: true, value: { text: sanitiseUserText(body.text, 1000) } };
}
