-- Server-side enforcement for the teacher Studio free tier.
-- Beta mode resolves to full_access=true, so current beta testers remain unrestricted.

create or replace function public.save_teacher_workspace(p_document jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  saved public.teacher_workspaces;
  owner_id uuid := auth.uid();
  access jsonb;
  full_access boolean := true;
  free_limits jsonb := '{}'::jsonb;
  curriculum_count integer := 0;
  session_count integer := 0;
  curriculum_limit integer := 1;
  session_limit integer := 3;
begin
  if owner_id is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;

  if jsonb_typeof(p_document) <> 'object'
     or jsonb_typeof(p_document->'courses') <> 'array'
     or jsonb_typeof(p_document->'sessions') <> 'array' then
    raise exception 'Invalid teacher workspace document' using errcode='22023';
  end if;

  access := public.get_product_access('teacher_studio');
  full_access := coalesce((access->>'full_access')::boolean,false);
  free_limits := coalesce(access->'free_limits','{}'::jsonb);

  if not full_access then
    curriculum_count := jsonb_array_length(p_document->'courses');
    session_count := jsonb_array_length(p_document->'sessions');
    curriculum_limit := greatest(0,coalesce((free_limits->>'curricula')::integer,1));
    session_limit := greatest(0,coalesce((free_limits->>'sessions')::integer,3));

    if curriculum_count > curriculum_limit or session_count > session_limit then
      raise sqlstate 'PGRST' using
        message = jsonb_build_object(
          'code','TEACHER_STUDIO_LIMIT',
          'message','Free Studio plan limit reached',
          'details',jsonb_build_object(
            'curricula',curriculum_count,
            'curricula_limit',curriculum_limit,
            'sessions',session_count,
            'sessions_limit',session_limit
          ),
          'hint','Upgrade to Full Studio or reduce saved plans.'
        )::text,
        detail = jsonb_build_object('status',402,'status_text','Payment Required')::text;
    end if;
  end if;

  if p_expected_revision=0 then
    insert into public.teacher_workspaces(user_id,document,revision)
    values(owner_id,p_document,1)
    on conflict(user_id) do nothing
    returning * into saved;
  else
    update public.teacher_workspaces
    set document=p_document,revision=revision+1,updated_at=now()
    where user_id=owner_id and revision=p_expected_revision
    returning * into saved;
  end if;

  if saved.user_id is null then
    raise exception 'Workspace changed; reload before saving' using errcode='40001';
  end if;

  return jsonb_build_object('document',saved.document,'revision',saved.revision,'updated_at',saved.updated_at);
end;
$$;
