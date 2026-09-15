create table if not exists public.mentorship_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  checkin_type text not null check (checkin_type in ('monthly','month_3','month_6','month_12')),
  cycle_key text not null check (char_length(cycle_key) between 3 and 40),
  due_on date not null,
  completed_at timestamptz not null default now(),
  progress_score smallint not null check (progress_score between 1 and 10),
  clarity_score smallint not null check (clarity_score between 1 and 10),
  goal_alignment_score smallint check (goal_alignment_score between 1 and 10),
  support_score smallint check (support_score between 1 and 10),
  experience_score smallint check (experience_score between 1 and 10),
  challenge_fit smallint not null check (challenge_fit between -2 and 2),
  responses jsonb not null default '{}'::jsonb check (jsonb_typeof(responses)='object' and octet_length(responses::text)<=20000),
  health_status text not null default 'healthy' check (health_status in ('healthy','review','priority')),
  health_reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(health_reasons)='array'),
  progress_trend text not null default 'baseline' check (progress_trend in ('baseline','stable','improving','slow_decline','sudden_decline','volatile')),
  teacher_review_status text not null default 'not_needed' check (teacher_review_status in ('not_needed','pending','approved','modified','dismissed')),
  teacher_note text check (teacher_note is null or char_length(teacher_note)<=4000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id,cycle_key)
);

create index if not exists mentorship_checkins_student_completed_idx
  on public.mentorship_checkins(student_id,completed_at desc);
create index if not exists mentorship_checkins_health_idx
  on public.mentorship_checkins(health_status,completed_at desc);

create table if not exists public.mentorship_checkin_suggestions (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.mentorship_checkins(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('roadmap_review','bottleneck','challenge_fit','program_request','load_adjustment','conversation')),
  title text not null check (char_length(title) between 1 and 180),
  detail text not null default '' check (char_length(detail)<=3000),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=10000),
  status text not null default 'pending' check (status in ('pending','approved','modified','dismissed')),
  coach_note text check (coach_note is null or char_length(coach_note)<=3000),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mentorship_checkin_suggestions_student_idx
  on public.mentorship_checkin_suggestions(student_id,status,created_at desc);

alter table public.mentorship_checkins enable row level security;
alter table public.mentorship_checkin_suggestions enable row level security;

revoke all on public.mentorship_checkins from anon, authenticated;
revoke all on public.mentorship_checkin_suggestions from anon, authenticated;
grant select on public.mentorship_checkins to authenticated;
grant select on public.mentorship_checkin_suggestions to authenticated;

drop policy if exists mentorship_checkins_select on public.mentorship_checkins;
create policy mentorship_checkins_select
  on public.mentorship_checkins for select to authenticated
  using (student_id=(select auth.uid()) or public.is_coach());

drop policy if exists mentorship_checkin_suggestions_coach_select on public.mentorship_checkin_suggestions;
create policy mentorship_checkin_suggestions_coach_select
  on public.mentorship_checkin_suggestions for select to authenticated
  using (public.is_coach());

create or replace function public.my_mentorship_started_on()
returns date
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    (select mo.started_on
       from public.mentorship_operations mo
      where mo.student_id=(select auth.uid()) and mo.started_on is not null
      order by mo.started_on asc
      limit 1),
    (select p.created_at::date from public.profiles p where p.id=(select auth.uid()))
  );
$$;
revoke all on function public.my_mentorship_started_on() from public,anon;
grant execute on function public.my_mentorship_started_on() to authenticated;

create or replace function public.get_mentorship_checkin_roster()
returns table(student_id uuid, display_name text, email text, started_on date)
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if not public.is_coach() then
    raise exception 'Coach access required' using errcode='42501';
  end if;
  return query
  select p.id,
         coalesce(nullif(btrim(p.display_name),''),p.email,'Student'),
         p.email,
         coalesce(m.started_on,p.created_at::date)
    from public.profiles p
    left join lateral (
      select mo.started_on
        from public.mentorship_operations mo
       where mo.student_id=p.id and mo.started_on is not null
       order by mo.started_on asc
       limit 1
    ) m on true
   where p.role='mentee'
   order by coalesce(nullif(btrim(p.display_name),''),p.email,'Student');
end $$;
revoke all on function public.get_mentorship_checkin_roster() from public,anon;
grant execute on function public.get_mentorship_checkin_roster() to authenticated;

create or replace function public.submit_mentorship_checkin(
  p_checkin_type text,
  p_cycle_key text,
  p_due_on date,
  p_progress_score smallint,
  p_clarity_score smallint,
  p_goal_alignment_score smallint default null,
  p_support_score smallint default null,
  p_experience_score smallint default null,
  p_challenge_fit smallint default 0,
  p_responses jsonb default '{}'::jsonb
)
returns public.mentorship_checkins
language plpgsql
security definer
set search_path=''
as $$
declare
  v_student uuid := auth.uid();
  v_prev public.mentorship_checkins;
  v_saved public.mentorship_checkins;
  v_status text := 'healthy';
  v_trend text := 'baseline';
  v_reasons jsonb := '[]'::jsonb;
  v_responses jsonb := coalesce(p_responses,'{}'::jsonb);
  v_declines integer := 0;
  v_need text;
  v_more text;
  v_less text;
  v_bottleneck text;
  v_goal_changed boolean := false;
  v_wants_conversation boolean := false;
  v_considering_leaving boolean := false;
begin
  if v_student is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_checkin_type not in ('monthly','month_3','month_6','month_12') then raise exception 'Invalid check-in type'; end if;
  if p_cycle_key is null or char_length(p_cycle_key) not between 3 and 40 then raise exception 'Invalid cycle key'; end if;
  if p_due_on is null then raise exception 'Due date required'; end if;
  if p_progress_score not between 1 and 10 or p_clarity_score not between 1 and 10 then raise exception 'Progress and clarity must be 1–10'; end if;
  if p_challenge_fit not between -2 and 2 then raise exception 'Invalid challenge fit'; end if;
  if p_checkin_type <> 'monthly' and (p_goal_alignment_score is null or p_support_score is null or p_experience_score is null) then
    raise exception 'Major check-ins require goal alignment, support, and experience scores';
  end if;
  if p_goal_alignment_score is not null and p_goal_alignment_score not between 1 and 10 then raise exception 'Goal alignment must be 1–10'; end if;
  if p_support_score is not null and p_support_score not between 1 and 10 then raise exception 'Support must be 1–10'; end if;
  if p_experience_score is not null and p_experience_score not between 1 and 10 then raise exception 'Experience must be 1–10'; end if;
  if jsonb_typeof(v_responses) <> 'object' or octet_length(v_responses::text)>20000 then raise exception 'Invalid responses'; end if;

  select * into v_saved
    from public.mentorship_checkins
   where student_id=v_student and cycle_key=p_cycle_key;
  if found then return v_saved; end if;

  select * into v_prev
    from public.mentorship_checkins
   where student_id=v_student
   order by completed_at desc
   limit 1;

  v_need := btrim(coalesce(v_responses->>'need',''));
  v_more := btrim(coalesce(v_responses->>'what_more',''));
  v_less := btrim(coalesce(v_responses->>'what_less',''));
  v_bottleneck := btrim(coalesce(v_responses->>'bottleneck',''));
  v_goal_changed := coalesce((v_responses->>'goals_changed')::boolean,false);
  v_wants_conversation := coalesce((v_responses->>'wants_conversation')::boolean,false);
  v_considering_leaving := coalesce((v_responses->>'considering_leaving')::boolean,false);

  if v_prev.id is not null then
    if p_progress_score >= v_prev.progress_score + 2 then v_trend := 'improving';
    elsif p_progress_score <= v_prev.progress_score - 3 then v_trend := 'sudden_decline';
    elsif p_progress_score < v_prev.progress_score then v_trend := 'slow_decline';
    else v_trend := 'stable'; end if;

    if v_prev.progress_score - p_progress_score >= 2 then v_declines := v_declines + 1; end if;
    if v_prev.clarity_score - p_clarity_score >= 2 then v_declines := v_declines + 1; end if;
    if v_prev.goal_alignment_score is not null and p_goal_alignment_score is not null and v_prev.goal_alignment_score - p_goal_alignment_score >= 2 then v_declines := v_declines + 1; end if;
    if v_prev.support_score is not null and p_support_score is not null and v_prev.support_score - p_support_score >= 2 then v_declines := v_declines + 1; end if;
    if v_prev.experience_score is not null and p_experience_score is not null and v_prev.experience_score - p_experience_score >= 2 then v_declines := v_declines + 1; end if;
  end if;

  if p_progress_score <= 4 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('Progress is 4/10 or lower.');
  elsif p_progress_score <= 6 then
    v_status := 'review';
    v_reasons := v_reasons || jsonb_build_array('Progress is currently 5–6/10.');
  end if;

  if p_clarity_score <= 4 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('The student feels unclear about what to work on next.');
  elsif p_clarity_score <= 6 and v_status='healthy' then
    v_status := 'review';
    v_reasons := v_reasons || jsonb_build_array('Training direction could be clearer.');
  end if;

  if p_support_score is not null and p_support_score <= 5 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('Support/belonging is 5/10 or lower.');
  end if;
  if p_experience_score is not null and p_experience_score <= 5 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('Overall mentorship experience is 5/10 or lower.');
  end if;
  if p_goal_alignment_score is not null and p_goal_alignment_score <= 6 then
    if v_status='healthy' then v_status := 'review'; end if;
    v_reasons := v_reasons || jsonb_build_array('Current training may no longer match the student’s goals.');
  end if;
  if abs(p_challenge_fit) >= 1 then
    if v_status='healthy' then v_status := 'review'; end if;
    v_reasons := v_reasons || jsonb_build_array(case when p_challenge_fit < 0 then 'Challenge feels too low.' else 'Challenge feels too high.' end);
  end if;

  if v_prev.id is not null and v_prev.progress_score - p_progress_score >= 3 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('Progress dropped by at least 3 points since the previous check-in.');
  elsif v_prev.id is not null and v_prev.progress_score - p_progress_score >= 2 then
    if v_status='healthy' then v_status := 'review'; end if;
    v_reasons := v_reasons || jsonb_build_array('Progress dropped by at least 2 points since the previous check-in.');
  end if;
  if v_declines >= 2 then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('Several mentorship dimensions declined together.');
  end if;

  if v_goal_changed then
    if v_status='healthy' then v_status := 'review'; end if;
    v_reasons := v_reasons || jsonb_build_array('The student says their goals changed.');
  end if;
  if v_need <> '' or v_more <> '' or v_less <> '' then
    if v_status='healthy' then v_status := 'review'; end if;
    v_reasons := v_reasons || jsonb_build_array('The student requested a change or additional support.');
  end if;
  if v_wants_conversation then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('The student explicitly asked to talk with Gab.');
  end if;
  if v_considering_leaving then
    v_status := 'priority';
    v_reasons := v_reasons || jsonb_build_array('The student indicated they may leave the mentorship.');
  end if;

  insert into public.mentorship_checkins(
    student_id,checkin_type,cycle_key,due_on,progress_score,clarity_score,
    goal_alignment_score,support_score,experience_score,challenge_fit,responses,
    health_status,health_reasons,progress_trend,teacher_review_status
  ) values (
    v_student,p_checkin_type,p_cycle_key,p_due_on,p_progress_score,p_clarity_score,
    p_goal_alignment_score,p_support_score,p_experience_score,p_challenge_fit,v_responses,
    v_status,v_reasons,v_trend,case when v_status='healthy' then 'not_needed' else 'pending' end
  ) returning * into v_saved;

  if p_progress_score <= 6 or v_bottleneck <> '' then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'bottleneck','Review the current bottleneck',coalesce(nullif(v_bottleneck,''),'Progress is below the healthy range.'),jsonb_build_object('progress_score',p_progress_score));
  end if;
  if abs(p_challenge_fit) >= 1 then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'challenge_fit','Adjust challenge level',case when p_challenge_fit < 0 then 'Student wants more challenge.' else 'Student reports that the current challenge is too high.' end,jsonb_build_object('challenge_fit',p_challenge_fit));
  end if;
  if v_goal_changed or (p_goal_alignment_score is not null and p_goal_alignment_score <= 6) then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'roadmap_review','Review roadmap direction','Goals or goal alignment changed. Open the student roadmap and decide what should move next.',jsonb_build_object('goal_alignment_score',p_goal_alignment_score,'goals_changed',v_goal_changed));
  end if;
  if v_more <> '' or (jsonb_typeof(v_responses->'focus_areas')='array' and jsonb_array_length(v_responses->'focus_areas')>0) then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'program_request','Student requested more emphasis',coalesce(nullif(v_more,''),'Review requested focus areas.'),jsonb_build_object('focus_areas',coalesce(v_responses->'focus_areas','[]'::jsonb)));
  end if;
  if v_less <> '' then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'load_adjustment','Student requested less of something',v_less,'{}'::jsonb);
  end if;
  if v_wants_conversation then
    insert into public.mentorship_checkin_suggestions(checkin_id,student_id,kind,title,detail,payload)
    values(v_saved.id,v_student,'conversation','Talk with this student','The student explicitly asked to talk with Gab.','{}'::jsonb);
  end if;

  if exists(select 1 from public.mentorship_checkin_suggestions s where s.checkin_id=v_saved.id) and v_saved.teacher_review_status='not_needed' then
    update public.mentorship_checkins set teacher_review_status='pending' where id=v_saved.id returning * into v_saved;
  end if;

  return v_saved;
end $$;
revoke all on function public.submit_mentorship_checkin(text,text,date,smallint,smallint,smallint,smallint,smallint,smallint,jsonb) from public,anon;
grant execute on function public.submit_mentorship_checkin(text,text,date,smallint,smallint,smallint,smallint,smallint,smallint,jsonb) to authenticated;

create or replace function public.decide_mentorship_checkin_suggestion(
  p_suggestion_id uuid,
  p_status text,
  p_coach_note text default null
)
returns public.mentorship_checkin_suggestions
language plpgsql
security definer
set search_path=''
as $$
declare v_saved public.mentorship_checkin_suggestions;
begin
  if not public.is_coach() then raise exception 'Coach access required' using errcode='42501'; end if;
  if p_status not in ('approved','modified','dismissed') then raise exception 'Invalid suggestion status'; end if;
  if p_coach_note is not null and char_length(p_coach_note)>3000 then raise exception 'Coach note is too long'; end if;
  update public.mentorship_checkin_suggestions
     set status=p_status,coach_note=p_coach_note,decided_by=auth.uid(),decided_at=now()
   where id=p_suggestion_id
   returning * into v_saved;
  if v_saved.id is null then raise exception 'Suggestion not found'; end if;
  return v_saved;
end $$;
revoke all on function public.decide_mentorship_checkin_suggestion(uuid,text,text) from public,anon;
grant execute on function public.decide_mentorship_checkin_suggestion(uuid,text,text) to authenticated;

create or replace function public.review_mentorship_checkin(
  p_checkin_id uuid,
  p_status text,
  p_teacher_note text default null
)
returns public.mentorship_checkins
language plpgsql
security definer
set search_path=''
as $$
declare v_saved public.mentorship_checkins;
begin
  if not public.is_coach() then raise exception 'Coach access required' using errcode='42501'; end if;
  if p_status not in ('approved','modified','dismissed') then raise exception 'Invalid review status'; end if;
  if p_teacher_note is not null and char_length(p_teacher_note)>4000 then raise exception 'Teacher note is too long'; end if;
  update public.mentorship_checkins
     set teacher_review_status=p_status,teacher_note=p_teacher_note,reviewed_by=auth.uid(),reviewed_at=now()
   where id=p_checkin_id
   returning * into v_saved;
  if v_saved.id is null then raise exception 'Check-in not found'; end if;
  return v_saved;
end $$;
revoke all on function public.review_mentorship_checkin(uuid,text,text) from public,anon;
grant execute on function public.review_mentorship_checkin(uuid,text,text) to authenticated;

comment on table public.mentorship_checkins is 'Longitudinal mentorship pulse and 3/6/12-month student check-ins. Students submit through a constrained RPC; coaches review trends and decide adaptations.';
comment on table public.mentorship_checkin_suggestions is 'Coach-only decision queue generated from mentorship check-ins. Suggestions never mutate a student roadmap automatically.';
