-- Server-side enforcement for the teacher Studio free tier.
-- Beta mode resolves to full_access=true, so current beta testers remain unrestricted.
-- When live mode begins, existing beta work remains editable even above the free allowance;
-- a free account simply cannot increase its plan count beyond its current ceiling.

create or replace function public.save_teacher_workspace(p_document jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  saved public.teacher_workspaces;
  existing_document jsonb;
  owner_id uuid := auth.uid();
  access jsonb;
  full_access boolean := true;
  free_limits jsonb := '{}'::jsonb;
  curriculum_count integer := 0;
  session_count integer := 0;
  existing_curriculum_count integer := 0;
  existing_session_count integer := 0;
  curriculum_limit integer := 1;
  session_limit integer := 3;
  curriculum_ceiling integer := 1;
  session_ceiling integer := 3;
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

    select w.document into existing_document
    from public.teacher_workspaces w
    where w.user_id=owner_id;

    if existing_document is not null then
      existing_curriculum_count := coalesce(jsonb_array_length(existing_document->'courses'),0);
      existing_session_count := coalesce(jsonb_array_length(existing_document->'sessions'),0);
    end if;

    curriculum_ceiling := greatest(curriculum_limit,existing_curriculum_count);
    session_ceiling := greatest(session_limit,existing_session_count);

    if curriculum_count > curriculum_ceiling or session_count > session_ceiling then
      raise sqlstate 'PGRST' using
        message = jsonb_build_object(
          'code','TEACHER_STUDIO_LIMIT',
          'message','Free Studio plan limit reached',
          'details',jsonb_build_object(
            'curricula',curriculum_count,
            'curricula_limit',curriculum_limit,
            'curricula_current_ceiling',curriculum_ceiling,
            'sessions',session_count,
            'sessions_limit',session_limit,
            'sessions_current_ceiling',session_ceiling
          ),
          'hint','Your existing beta work is preserved. Upgrade to Full Studio to add beyond your current plan count.'
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
