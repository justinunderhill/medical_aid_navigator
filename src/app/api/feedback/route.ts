import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/supabase/client';
import { rateLimit, clientKey, sanitiseUserText } from '@/lib/safety/guards';

export const runtime = 'nodejs';

// POST /api/feedback — anonymous, optional email. No account required (FR12).
export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req.headers));
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = sanitiseUserText(body.email, 254);
  // very light email shape check; empty is fine (optional)
  const emailOk = email === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: 'Please enter a valid email or leave it blank.' }, { status: 400 });
  }

  const useful = sanitiseUserText(body.useful, 16).toLowerCase();
  const wasUseful =
    useful === 'yes'
      ? true
      : useful === 'no'
        ? false
        : typeof body.wasUseful === 'boolean'
          ? body.wasUseful
          : null;
  const situation = sanitiseUserText(body.situation ?? body.scenarioId, 64) || null;

  const result = await saveFeedback({
    wasUseful,
    scenarioId: situation,
    unclear: sanitiseUserText(body.comment ?? body.unclear, 1000) || null,
    wishlist: sanitiseUserText(body.wishlist, 1000) || null,
    email: email || null,
  });

  if (!result.ok) {
    // Surface the underlying reason in the server logs so a misconfigured
    // store (missing table, bad key, etc.) is diagnosable — without leaking
    // it to the client.
    console.error('[feedback] save failed:', result.error ?? 'unknown error');
    return NextResponse.json({ error: 'Could not save feedback.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
