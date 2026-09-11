create table public.atlas_imports (
 id uuid primary key default gen_random_uuid(),
 source text not null default 'granola' check (source='granola'),
 source_id uuid not null unique,
 source_title text not null check (char_length(source_title) between 1 and 500),
 source_excerpt text not null check (char_length(source_excerpt) between 1 and 20000),
 student_id uuid not null references public.profiles(id),
 lesson_date date not null,
 summary text not null check (char_length(btrim(summary)) between 1 and 3000),
 practice text not null default '' check (char_length(practice)<=2000),
 concepts jsonb not null check (public.valid_atlas_concepts(concepts)),
 mapping_notes text not null default '' check (char_length(mapping_notes)<=5000),
 status text not null default 'pending' check (status in ('pending','approved','dismissed')),
 created_at timestamptz not null default now(),
 approved_by uuid references public.profiles(id),
 approved_at timestamptz
);
create index atlas_imports_student_id on public.atlas_imports(student_id);
create index atlas_imports_approved_by on public.atlas_imports(approved_by);
alter table public.atlas_imports enable row level security;
revoke all on public.atlas_imports from public, anon, authenticated;
grant select on public.atlas_imports to authenticated;
grant update(status,approved_by,approved_at) on public.atlas_imports to authenticated;
create policy atlas_imports_coach_read on public.atlas_imports for select to authenticated using ((select public.is_coach()));
create policy atlas_imports_coach_review on public.atlas_imports for update to authenticated using ((select public.is_coach())) with check ((select public.is_coach()));

-- One transaction links the review to one lesson. The stable ID makes retries safe.
create function public.approve_atlas_import(p_import_id uuid,p_student_id uuid,p_lesson_date date,p_summary text,p_practice text,p_concepts jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare draft public.atlas_imports;
begin
 if not coalesce(public.is_coach(),false) then raise exception 'Coach access required' using errcode='42501';end if;
 select * into draft from public.atlas_imports where id=p_import_id for update;
 if not found then raise exception 'Draft unavailable';end if;
 if draft.status='approved' then
   if not exists(select 1 from public.atlas_lessons where id=draft.id) then raise exception 'Approved lesson unavailable';end if;
   return draft.id;
 end if;
 if draft.status<>'pending' then raise exception 'This draft is no longer pending';end if;
 insert into public.atlas_lessons(id,student_id,lesson_date,summary,practice,concepts)
 values(draft.id,p_student_id,p_lesson_date,btrim(p_summary),coalesce(p_practice,''),p_concepts);
 update public.atlas_imports set status='approved',approved_by=auth.uid(),approved_at=now() where id=draft.id;
 return draft.id;
end;
$$;
revoke all on function public.approve_atlas_import(uuid,uuid,date,text,text,jsonb) from public,anon;
grant execute on function public.approve_atlas_import(uuid,uuid,date,text,text,jsonb) to authenticated;
comment on table public.atlas_imports is 'Private coach-only import review inbox. Source excerpts are never copied into student lessons. Source IDs deduplicate imports.';
