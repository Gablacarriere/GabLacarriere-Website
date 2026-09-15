create table if not exists public.teaching_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  planner_session_id text,
  source text not null default 'manual' check (char_length(source) between 1 and 80),
  class_date date not null default current_date,
  title text not null default '' check (char_length(title) <= 500),
  concept_id text check (concept_id is null or char_length(concept_id) <= 120),
  technical_outcome text not null default '' check (char_length(technical_outcome) <= 10000),
  social_outcome text not null default '' check (char_length(social_outcome) <= 10000),
  personal_outcome text not null default '' check (char_length(personal_outcome) <= 10000),
  intended_learning text not null default '' check (char_length(intended_learning) <= 10000),
  observed_evidence text not null default '' check (char_length(observed_evidence) <= 10000),
  transferred text not null default '' check (char_length(transferred) <= 10000),
  breakdown text not null default '' check (char_length(breakdown) <= 10000),
  next_change text not null default '' check (char_length(next_change) <= 10000),
  confidence smallint check (confidence is null or confidence between 1 and 5),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_evidence_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists teaching_evidence_owner_session_uidx
  on public.teaching_evidence(owner_id, planner_session_id);
create index if not exists teaching_evidence_owner_date_idx
  on public.teaching_evidence(owner_id, class_date desc, created_at desc);

alter table public.teaching_evidence enable row level security;
revoke all on public.teaching_evidence from anon, authenticated;
grant select, insert, update, delete on public.teaching_evidence to authenticated;

drop policy if exists teaching_evidence_select_own on public.teaching_evidence;
create policy teaching_evidence_select_own on public.teaching_evidence
  for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists teaching_evidence_insert_own on public.teaching_evidence;
create policy teaching_evidence_insert_own on public.teaching_evidence
  for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists teaching_evidence_update_own on public.teaching_evidence;
create policy teaching_evidence_update_own on public.teaching_evidence
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
drop policy if exists teaching_evidence_delete_own on public.teaching_evidence;
create policy teaching_evidence_delete_own on public.teaching_evidence
  for delete to authenticated using ((select auth.uid()) = owner_id);

comment on table public.teaching_evidence is 'Private longitudinal teacher reflection/evidence ledger. Owner-only via RLS; separate from student progress and public methodology.';
