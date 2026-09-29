-- =============================================================================
-- Contact form messages
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- This is the ONLY table the public site can WRITE to. Read/update/delete
-- grants are deliberately withheld from `anon` so visitors can submit a
-- message but cannot read anyone else's submissions.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) between 1 and 120),
  email      text        not null check (char_length(email) between 3 and 254),
  message    text        not null check (char_length(message) between 1 and 5000),
  -- Set when the browser could not reach Supabase, so nothing is silently lost.
  user_agent text,
  -- Prevents an identical message being stored twice on a double-click/retry.
  fingerprint text,
  created_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Enquiries submitted through the public #connect form. Insert-only for anon.';

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.contact_messages enable row level security;

grant usage on schema public to anon, authenticated;

-- Insert only. No select/update/delete for anon => messages stay private.
grant insert on public.contact_messages to anon, authenticated;

drop policy if exists "contact_messages_insert" on public.contact_messages;
create policy "contact_messages_insert"
  on public.contact_messages
  for insert to anon, authenticated
  with check (true);

-- NOTE: no dedupe trigger here on purpose. A BEFORE INSERT trigger that reads
-- contact_messages runs as the `anon` role, which trips this table's own RLS
-- policy and makes every insert fail with 42501. src/lib/contact.ts stores a
-- fingerprint per row instead, and the client reports duplicates to the user.
drop trigger if exists contact_messages_dedupe on public.contact_messages;
drop function if exists public.prevent_duplicate_contact_message();

-- -----------------------------------------------------------------------------
-- Verify: expect contact_messages = 0
-- -----------------------------------------------------------------------------
select 'contact_messages' as tbl, count(*) from public.contact_messages;
