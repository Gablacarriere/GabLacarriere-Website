create table public.teacher_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null default '{"version":2,"courses":[],"sessions":[]}'::jsonb,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint teacher_document_shape check (
 jsonb_typeof(document)='object' and document->>'version'='2'
 and jsonb_typeof(document->'courses')='array' and jsonb_typeof(document->'sessions')='array'
 and jsonb_array_length(document->'courses')<=100 and jsonb_array_length(document->'sessions')<=500
 and octet_length(document::text)<=2097152)
);
alter table public.teacher_workspaces enable row level security;
revoke all on public.teacher_workspaces from anon, authenticated;
grant select, insert, update on public.teacher_workspaces to authenticated;
create policy teacher_workspace_select on public.teacher_workspaces for select to authenticated using ((select auth.uid())=user_id);
create policy teacher_workspace_insert on public.teacher_workspaces for insert to authenticated with check ((select auth.uid())=user_id);
create policy teacher_workspace_update on public.teacher_workspaces for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.save_teacher_workspace(p_document jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.teacher_workspaces; owner_id uuid := auth.uid();
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_expected_revision=0 then
  insert into public.teacher_workspaces(user_id,document,revision) values(owner_id,p_document,1)
  on conflict(user_id) do nothing returning * into saved;
 else
  update public.teacher_workspaces set document=p_document,revision=revision+1,updated_at=now()
  where user_id=owner_id and revision=p_expected_revision returning * into saved;
 end if;
 if saved.user_id is null then raise exception 'Workspace changed; reload before saving' using errcode='40001'; end if;
 return jsonb_build_object('document',saved.document,'revision',saved.revision,'updated_at',saved.updated_at);
end $$;
revoke all on function public.save_teacher_workspace(jsonb,bigint) from public,anon;
grant execute on function public.save_teacher_workspace(jsonb,bigint) to authenticated;
comment on table public.teacher_workspaces is 'Private teacher studio plans, with ownership RLS and optimistic revisions. Separate from student progress or mentorship entitlements.';

alter table public.teacher_workspaces add constraint teacher_document_required_keys check (document ?& array['version','courses','sessions']);
