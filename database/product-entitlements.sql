-- Shared product access foundation for teacher tools and Zoukable.
-- Mentorship membership is an entitlement source, not a duplicated account flag.

create table public.product_access_settings (
  product_key text primary key check (product_key in ('teacher_studio','zoukable')),
  mode text not null default 'beta' check (mode in ('beta','live')),
  free_limits jsonb not null default '{}'::jsonb check (jsonb_typeof(free_limits)='object'),
  updated_at timestamptz not null default now()
);

alter table public.product_access_settings enable row level security;
revoke all on table public.product_access_settings from public, anon, authenticated;
grant select, insert, update, delete on table public.product_access_settings to service_role;

insert into public.product_access_settings(product_key,mode,free_limits)
values
  ('teacher_studio','beta','{"curricula":1,"sessions":3}'::jsonb),
  ('zoukable','beta','{"starter_drills":5,"weekly_quests":1}'::jsonb)
on conflict(product_key) do update
set free_limits=excluded.free_limits,
    updated_at=now();

create table public.product_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null check (product_key in ('all','teacher_studio','zoukable')),
  tier text not null default 'pro' check (tier in ('pro')),
  status text not null default 'active' check (status in ('active','trialing','cancelled','expired')),
  source text not null default 'manual' check (source in ('manual','stripe','promo','beta')),
  access_until timestamptz,
  provider_customer_ref text,
  provider_subscription_ref text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,product_key)
);

alter table public.product_entitlements enable row level security;
revoke all on table public.product_entitlements from public, anon, authenticated;
grant select, insert, update, delete on table public.product_entitlements to service_role;
create index product_entitlements_active_lookup on public.product_entitlements(user_id,product_key,status,access_until);

comment on table public.product_entitlements is 'Server-managed paid/promotional product access. Browser clients cannot mutate entitlements.';
comment on table public.product_access_settings is 'Launch switch and free-tier limits for subscription products. Beta mode keeps premium features unlocked while testing.';

create or replace function public.get_product_access(p_product_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_mode text;
  v_limits jsonb;
  v_staff boolean := false;
  v_mentorship boolean := false;
  v_pro boolean := false;
  v_tier text := 'free';
  v_full_access boolean := false;
begin
  if v_uid is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;

  if p_product_key not in ('teacher_studio','zoukable') then
    raise exception 'Unknown product' using errcode='22023';
  end if;

  select s.mode,s.free_limits
    into v_mode,v_limits
  from public.product_access_settings s
  where s.product_key=p_product_key;

  if v_mode is null then
    v_mode := 'beta';
    v_limits := '{}'::jsonb;
  end if;

  select exists(
    select 1 from public.profiles p
    where p.id=v_uid and p.role='coach'
  ) into v_staff;

  select exists(
    select 1 from public.mentorship_operations m
    where m.student_id=v_uid
      and m.membership_status in ('active','assistant','advance_paid')
  ) into v_mentorship;

  select exists(
    select 1 from public.product_entitlements e
    where e.user_id=v_uid
      and e.product_key in ('all',p_product_key)
      and e.status in ('active','trialing')
      and (e.access_until is null or e.access_until>now())
  ) into v_pro;

  if v_staff then
    v_tier := 'staff';
  elsif v_mentorship then
    v_tier := 'mentorship';
  elsif v_pro then
    v_tier := 'pro';
  end if;

  v_full_access := v_mode='beta' or v_tier in ('staff','mentorship','pro');

  return jsonb_build_object(
    'product_key',p_product_key,
    'mode',v_mode,
    'tier',v_tier,
    'full_access',v_full_access,
    'free_limits',coalesce(v_limits,'{}'::jsonb),
    'included_with_mentorship',v_mentorship,
    'reason',case
      when v_staff then 'staff'
      when v_mentorship then 'mentorship'
      when v_pro then 'subscription'
      when v_mode='beta' then 'beta_preview'
      else 'free'
    end
  );
end;
$$;

revoke all on function public.get_product_access(text) from public, anon;
grant execute on function public.get_product_access(text) to authenticated;

comment on function public.get_product_access(text) is 'Returns only the calling user’s abstract product tier. Intentionally SECURITY DEFINER so membership and server-managed entitlement rows remain otherwise private.';

-- Launch is deliberately a data switch, not a code deploy:
-- update public.product_access_settings set mode='live', updated_at=now() where product_key='teacher_studio';
