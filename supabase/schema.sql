-- Medical Aid Navigator — Supabase schema
-- Run this in the Supabase SQL editor.
-- Feedback only. No member numbers, ID numbers, or medical records (POPIA).

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  was_useful  boolean,
  scenario_id text,
  unclear     text,
  wishlist    text,
  email       text,            -- optional, user-provided only
  created_at  timestamptz not null default now()
);

-- Row Level Security: inserts happen via the service role key on the server,
-- so we keep RLS on and add no public policies (no anonymous client writes).
alter table public.feedback enable row level security;

-- (Intentionally no public insert/select policy. Server uses service role.)

comment on table public.feedback is
  'Anonymous, optional product feedback for Medical Aid Navigator MVP. No PII beyond optional email.';
