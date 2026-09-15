-- Coach-only pilot observations for Dance Puzzles.
-- Student access is intentionally absent during the pilot.

create table if not exists public.dance_puzzle_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  coach_id uuid not null default auth.uid() references public.profiles(id),
  puzzle_id text not null check (puzzle_id ~ '^DP-[0-9]{3}$'),
  assessed_at timestamptz not null default now(),
  context text not null default 'class' check (context in ('class','private','mentorship','social','other')),
  recognition smallint check (recognition between 1 and 5),
  visualization smallint check (visualization between 1 and 5),
  calculation smallint check (calculation between 1 and 5),
  decision_quality smallint check (decision_quality between 1 and 5),
  adaptation smallint check (adaptation between 1 and 5),
  puzzle_usefulness smallint check (puzzle_usefulness between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  constraint dance_puzzle_assessments_has_observation check (
    num_nonnulls(recognition, visualization, calculation, decision_quality, adaptation, puzzle_usefulness) > 0
  )
);

create index if not exists dance_puzzle_assessments_student_time_idx
  on public.dance_puzzle_assessments(student_id, assessed_at desc);
create index if not exists dance_puzzle_assessments_puzzle_time_idx
  on public.dance_puzzle_assessments(puzzle_id, assessed_at desc);
create index if not exists dance_puzzle_assessments_coach_idx
  on public.dance_puzzle_assessments(coach_id);

alter table public.dance_puzzle_assessments enable row level security;

create policy dance_puzzle_assessments_coach_select
  on public.dance_puzzle_assessments for select to authenticated
  using (public.is_coach());

create policy dance_puzzle_assessments_coach_insert
  on public.dance_puzzle_assessments for insert to authenticated
  with check (public.is_coach() and coach_id = (select auth.uid()));

grant select, insert on public.dance_puzzle_assessments to authenticated;
