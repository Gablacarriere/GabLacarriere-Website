-- Atlas IDs are persisted keys: do not reorder existing curriculum topics.
create function public.valid_atlas_concepts(value jsonb)
returns boolean language sql immutable strict security invoker set search_path = pg_catalog as $$
 select case when jsonb_typeof(value) <> 'object' then false else
 (select count(*) between 1 and 56 and bool_and(key = any(array['organization-0','organization-1','organization-2','connection-0','connection-1','connection-2','connection-3','connection-4','connection-5','steps-0','steps-1','steps-2','steps-3','steps-4','steps-5','spirals-0','spirals-1','spirals-2','spirals-3','spirals-4','spirals-5','awareness-0','bridge-0','bridge-1','bridge-2','bridge-3','bridge-4','bridge-5','architecture-0','architecture-1','architecture-2','architecture-3','architecture-4','architecture-5','architecture-6','architecture-7','patterns-0','patterns-1','patterns-2','patterns-3','patterns-4','patterns-5','patterns-6','patterns-7','patterns-8','patterns-9','patterns-10','patterns-11','patterns-12','patterns-13','patterns-14','patterns-15','patterns-16','patterns-17','patterns-18','patterns-19' ]::text[]) and val in ('"Introduced"'::jsonb,'"Practicing"'::jsonb,'"Integrating"'::jsonb)) from jsonb_each(value) as item(key,val)) end;
$$;
revoke all on function public.valid_atlas_concepts(jsonb) from public, anon;
grant execute on function public.valid_atlas_concepts(jsonb) to authenticated;
create table public.atlas_lessons (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.profiles(id) on delete cascade,
 coach_id uuid not null default auth.uid() references public.profiles(id),
 lesson_date date not null,
 summary text not null check (char_length(btrim(summary)) between 1 and 3000),
 practice text not null default '' check (char_length(practice)<=2000),
 concepts jsonb not null check (public.valid_atlas_concepts(concepts)),
 voided boolean not null default false,
 created_at timestamptz not null default now()
);
create index atlas_lessons_student_date on public.atlas_lessons(student_id,lesson_date desc,created_at desc,id);
create index atlas_lessons_coach_id on public.atlas_lessons(coach_id);
alter table public.atlas_lessons enable row level security;
revoke all on public.atlas_lessons from anon, authenticated;
grant select on public.atlas_lessons to authenticated;
grant insert(id,student_id,lesson_date,summary,practice,concepts) on public.atlas_lessons to authenticated;
grant update(voided) on public.atlas_lessons to authenticated;
create policy atlas_read_own_or_coach on public.atlas_lessons for select to authenticated using (student_id=(select auth.uid()) or (select public.is_coach()));
create policy atlas_coach_record on public.atlas_lessons for insert to authenticated with check ((select public.is_coach()) and coach_id=(select auth.uid()) and not voided);
create policy atlas_coach_correct on public.atlas_lessons for update to authenticated using ((select public.is_coach())) with check ((select public.is_coach()));
comment on table public.atlas_lessons is 'Coach-recorded student-visible lessons. Concepts are observations, not awards or inferred mastery. Voiding preserves correction history.';
