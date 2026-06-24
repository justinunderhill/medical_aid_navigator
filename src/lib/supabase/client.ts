import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase server client (feedback storage only).
 * Uses the service role key — SERVER SIDE ONLY. Never import this into a
 * client component.
 */

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // feedback gracefully no-ops if unconfigured
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export interface FeedbackInput {
  wasUseful: boolean | null;
  scenarioId: string | null;
  unclear: string | null;
  wishlist: string | null;
  email: string | null; // optional
}

export async function saveFeedback(
  input: FeedbackInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    // Not configured yet — log and succeed so the UX is not blocked.
    console.info('[feedback] (no Supabase configured) ', {
      ...input,
      email: input.email ? '[provided]' : null, // never log raw email
    });
    return { ok: true };
  }

  const { error } = await supabase.from('feedback').insert({
    was_useful: input.wasUseful,
    scenario_id: input.scenarioId,
    unclear: input.unclear,
    wishlist: input.wishlist,
    email: input.email,
    created_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
