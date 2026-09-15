-- Zoukable freemium boundary.
-- Beta mode remains fully unlocked through get_product_access('zoukable').
-- When launch mode becomes live, Free keeps a deliberate starter experience while
-- Full / Mentorship / staff retain the complete adaptive practice system.

alter table public.zoukable_drills
  add column if not exists access_tier text not null default 'full'
  check (access_tier in ('free','full'));

update public.zoukable_drills
set access_tier='full'
where access_tier is distinct from 'full';

-- Deliberate solo starter pack: weight transfer, rotation, dissociation,
-- timing and neutral-head organization. Use stable titles rather than generated IDs.
update public.zoukable_drills
set access_tier='free'
where title in (
  'Side–Center–Other-Side Weight Transfer',
  'Rotation Through Steps',
  'Basic-Step Torsion + Consequential Styling',
  'Traditional 1 ↔ Traditional 2 Timing Switch',
  'Neutral Head Reset — Lengthen, Return, Breathe'
);

create index if not exists zoukable_drills_access_tier_idx
  on public.zoukable_drills(access_tier,status,assigned_to);

update public.product_access_settings
set free_limits=jsonb_build_object(
  'starter_drills',5,
  'weekly_quests',1,
  'rhythm_studio',true,
  'social_journal',true
), updated_at=now()
where product_key='zoukable';

-- Full drill content is a server-side entitlement, not a browser-only lock.
drop policy if exists drills_read on public.zoukable_drills;
create policy drills_read
on public.zoukable_drills
for select
to authenticated
using (
  (select public.is_coach())
  or (
    status='published'
    and (assigned_to is null or assigned_to=(select auth.uid()))
    and exists (
      select 1 from public.profiles p
      where p.id=(select auth.uid())
    )
    and (
      assigned_to=(select auth.uid())
      or access_tier='free'
      or coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
    )
  )
);

-- Review state continues to be collected by trusted triggers, so a Free user who
-- upgrades later keeps their practice history. The adaptive queue itself is Full.
drop policy if exists reviews_read on public.zoukable_review_states;
create policy reviews_read
on public.zoukable_review_states
for select
to authenticated
using (
  (select public.is_coach())
  or (
    user_id=(select auth.uid())
    and coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
  )
);

drop policy if exists snoozes_own on public.zoukable_snoozes;
create policy snoozes_own
on public.zoukable_snoozes
for all
to authenticated
using (
  user_id=(select auth.uid())
  and coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
)
with check (
  user_id=(select auth.uid())
  and coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
);

-- Diagnostics are part of Full. The ordinary practice loop remains available Free.
drop policy if exists diagnostics_read on public.zoukable_diagnostics;
create policy diagnostics_read
on public.zoukable_diagnostics
for select
to authenticated
using (
  (select public.is_coach())
  or (
    user_id=(select auth.uid())
    and coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
  )
);

drop policy if exists diagnostics_insert on public.zoukable_diagnostics;
create policy diagnostics_insert
on public.zoukable_diagnostics
for insert
to authenticated
with check (
  user_id=(select auth.uid())
  and coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
);

-- Free gets one habit-building weekly mission. Full gets the three-mission rotation.
drop policy if exists "users read own quests" on public.zoukable_user_quests;
create policy "users read own quests"
on public.zoukable_user_quests
for select
to authenticated
using (
  (select public.is_coach())
  or (
    user_id=(select auth.uid())
    and (
      quest_id='show-up-twice'
      or coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
    )
  )
);

drop policy if exists "users read own quest rewards" on public.zoukable_quest_rewards;
create policy "users read own quest rewards"
on public.zoukable_quest_rewards
for select
to authenticated
using (
  (select public.is_coach())
  or (
    user_id=(select auth.uid())
    and (
      quest_id='show-up-twice'
      or coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
    )
  )
);

drop policy if exists "users acknowledge own quest rewards" on public.zoukable_quest_rewards;
create policy "users acknowledge own quest rewards"
on public.zoukable_quest_rewards
for update
to authenticated
using (
  user_id=(select auth.uid())
  and (
    quest_id='show-up-twice'
    or coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
  )
)
with check (
  user_id=(select auth.uid())
  and (
    quest_id='show-up-twice'
    or coalesce((select (public.get_product_access('zoukable')->>'full_access')::boolean),false)
  )
);

create or replace function zoukable_private.refresh_weekly_quests(p_user uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public','zoukable_private'
as $$
declare
  v_today date := timezone('America/New_York',now())::date;
  v_week date;
  v_start timestamptz;
  v_end timestamptz;
  q record;
  v_progress integer;
  v_inserted integer;
  v_full_access boolean := true;
begin
  if p_user is null then return; end if;
  v_full_access := coalesce((public.get_product_access('zoukable')->>'full_access')::boolean,false);
  v_week := v_today - (extract(isodow from v_today)::int - 1);
  v_start := v_week::timestamp at time zone 'America/New_York';
  v_end := (v_week + 7)::timestamp at time zone 'America/New_York';

  insert into public.zoukable_user_quests(user_id,quest_id,week_start)
  select p_user,d.id,v_week
  from public.zoukable_quest_definitions d
  where d.active and d.id='show-up-twice'
  on conflict do nothing;

  if v_full_access then
    insert into public.zoukable_user_quests(user_id,quest_id,week_start)
    select p_user,d.id,v_week
    from public.zoukable_quest_definitions d
    where d.active and d.id<>'show-up-twice'
    order by md5(p_user::text || ':' || v_week::text || ':' || d.id)
    limit 2
    on conflict do nothing;
  end if;

  for q in
    select uq.quest_id,d.quest_type,d.target,d.reward_stars
    from public.zoukable_user_quests uq
    join public.zoukable_quest_definitions d on d.id=uq.quest_id
    where uq.user_id=p_user
      and uq.week_start=v_week
      and (v_full_access or uq.quest_id='show-up-twice')
  loop
    if q.quest_type='practice_days' then
      select count(distinct timezone('America/New_York',a.completed_at)::date)::int into v_progress
      from public.zoukable_attempts a
      where a.user_id=p_user and a.status='completed' and a.completed_at>=v_start and a.completed_at<v_end;
    elsif q.quest_type='skill_variety' then
      select count(distinct a.primary_skill_id)::int into v_progress
      from public.zoukable_attempts a
      where a.user_id=p_user and a.status='completed' and a.completed_at>=v_start and a.completed_at<v_end;
    elsif q.quest_type='practice_minutes' then
      select floor(coalesce(sum(a.practice_seconds),0)/60.0)::int into v_progress
      from public.zoukable_attempts a
      where a.user_id=p_user and a.status='completed' and a.completed_at>=v_start and a.completed_at<v_end;
    elsif q.quest_type='social_transfer' then
      select count(*)::int into v_progress
      from public.zoukable_social_logs s
      where s.user_id=p_user and s.created_at>=v_start and s.created_at<v_end and s.outcome in ('intentional','natural');
    elsif q.quest_type='review_return' then
      select case when exists(
        select 1 from public.zoukable_attempts a
        where a.user_id=p_user and a.status='completed' and a.completed_at>=v_start and a.completed_at<v_end
          and exists(
            select 1 from public.zoukable_attempts prev
            where prev.user_id=p_user and prev.drill_id=a.drill_id and prev.status='completed'
              and prev.completed_at is not null and prev.completed_at <= a.completed_at - interval '12 hours'
          )
      ) then 1 else 0 end into v_progress;
    else
      v_progress := 0;
    end if;

    update public.zoukable_user_quests
    set progress=greatest(0,coalesce(v_progress,0)),
        completed_at=case when completed_at is not null then completed_at when coalesce(v_progress,0)>=q.target then now() else null end,
        updated_at=now()
    where user_id=p_user and quest_id=q.quest_id and week_start=v_week;

    insert into public.zoukable_quest_rewards(user_id,quest_id,week_start,stars,metadata)
    select p_user,q.quest_id,v_week,q.reward_stars,jsonb_build_object('target',q.target,'progress',coalesce(v_progress,0),'week_start',v_week)
    from public.zoukable_user_quests uq
    where uq.user_id=p_user and uq.quest_id=q.quest_id and uq.week_start=v_week and uq.completed_at is not null
    on conflict do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      insert into public.zoukable_quest_wallet(user_id,stars) values(p_user,q.reward_stars)
      on conflict(user_id) do update set stars=public.zoukable_quest_wallet.stars+excluded.stars,updated_at=now();
    end if;
  end loop;

  insert into public.zoukable_quest_wallet(user_id) values(p_user) on conflict(user_id) do nothing;
end;
$$;

comment on column public.zoukable_drills.access_tier is
  'Free starter drills remain accessible after Zoukable launch; full drills require Full, Mentorship, or beta access.';
