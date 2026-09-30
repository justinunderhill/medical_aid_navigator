import { sanitiseUserText } from '@/lib/safety/guards';

/**
 * Vercel Functions cap request bodies at 4.5 MB, so 4 MB leaves room for the
 * multipart envelope. Documents are processed in memory and never stored.
 */
export const MAX_PLAN_BYTES = 4 * 1024 * 1024;
export const MAX_QUESTION_CHARS = 500;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** A real PDF starts with "%PDF-" — the MIME type alone is client-controlled. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d //   -
  );
}

export function validatePlanUpload(bytes: Uint8Array): Result<Uint8Array> {
  if (bytes.length === 0) return { ok: false, error: 'That file is empty.' };
  if (bytes.length > MAX_PLAN_BYTES) {
    return {
      ok: false,
      error: 'That file is larger than 4 MB. Try exporting just the benefit pages, or a smaller version of the guide.',
    };
  }
  if (!looksLikePdf(bytes)) {
    return { ok: false, error: 'Please upload a PDF of your plan document.' };
  }
  return { ok: true, value: bytes };
}

export function validateQuestion(raw: unknown): Result<string> {
  const question = sanitiseUserText(raw, MAX_QUESTION_CHARS);
  if (question.length < 5) {
    return { ok: false, error: 'Ask a question about your cover, e.g. "Is an MRI covered and do I need pre-authorisation?"' };
  }
  return { ok: true, value: question };
}
