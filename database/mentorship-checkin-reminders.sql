create table if not exists public.mentorship_checkin_reminder_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  cycle_key text not null check (char_length(cycle_key) between 3 and 40),
  reminder_stage text not null check (reminder_stage in ('due','overdue_3','overdue_7')),
  checkin_type text not null check (checkin_type in ('monthly','month_3','month_6','month_12')),
  due_on date not null,
  delivery text not null default 'gmail' check (delivery='gmail'),
  message_id text,
  sent_at timestamptz not null default now(),
  unique(student_id,cycle_key,reminder_stage)
);

create index if not exists mentorship_checkin_reminder_log_student_idx
  on public.mentorship_checkin_reminder_log(student_id,sent_at desc);

alter table public.mentorship_checkin_reminder_log enable row level security;
revoke all on public.mentorship_checkin_reminder_log from public, anon, authenticated;

create or replace view public.mentorship_checkin_reminder_queue as
with latest_ops as (
  select distinct on (mo.student_id)
    mo.student_id,
    mo.started_on,
    mo.membership_status
  from public.mentorship_operations mo
  where mo.student_id is not null
    and mo.membership_status in ('active','advance_paid')
  order by mo.student_id, mo.updated_at desc, mo.created_at desc
),
base as (
  select
    p.id as student_id,
    coalesce(nullif(btrim(p.display_name),''),split_part(p.email,'@',1),'Student') as display_name,
    p.email,
    coalesce(o.started_on,p.created_at::date) as started_on,
    greatest(0,
      (extract(year from age(current_date,coalesce(o.started_on,p.created_at::date)))::int * 12) +
      extract(month from age(current_date,coalesce(o.started_on,p.created_at::date)))::int
    ) as elapsed_months
  from latest_ops o
  join public.profiles p on p.id=o.student_id
  where p.role='mentee'
    and p.email is not null
    and btrim(p.email)<>''
),
next_due as (
  select b.*,
    case
      when b.elapsed_months >= 12 and not exists (select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_12') then 'month_12'
      when b.elapsed_months >= 6 and b.elapsed_months < 12 and not exists (select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_6') then 'month_6'
      when b.elapsed_months >= 3 and b.elapsed_months < 6 and not exists (select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_3') then 'month_3'
      when b.elapsed_months >= 1 then 'monthly'
      else null
    end as checkin_type
  from base b
),
dated as (
  select n.*,
    case n.checkin_type
      when 'month_3' then greatest((n.started_on + interval '3 months')::date,date '2026-09-14')
      when 'month_6' then greatest((n.started_on + interval '6 months')::date,date '2026-09-14')
      when 'month_12' then greatest((n.started_on + interval '12 months')::date,date '2026-09-14')
      when 'monthly' then greatest((n.started_on + (n.elapsed_months || ' months')::interval)::date,date '2026-09-14')
      else null
    end as due_on
  from next_due n
  where n.checkin_type is not null
),
cycles as (
  select d.*,
    case d.checkin_type
      when 'month_3' then 'milestone:3'
      when 'month_6' then 'milestone:6'
      when 'month_12' then 'milestone:12'
      when 'monthly' then 'monthly:' || to_char(d.due_on,'YYYY-MM')
    end as cycle_key
  from dated d
),
open_due as (
  select c.*,(current_date-c.due_on) as days_overdue
  from cycles c
  where c.due_on <= current_date
    and not exists (select 1 from public.mentorship_checkins ci where ci.student_id=c.student_id and ci.cycle_key=c.cycle_key)
    and not (
      c.checkin_type='monthly' and exists (
        select 1 from public.mentorship_checkins cm
        where cm.student_id=c.student_id
          and to_char(cm.completed_at at time zone 'America/New_York','YYYY-MM')=to_char(current_date,'YYYY-MM')
      )
    )
),
staged as (
  select o.*,
    case
      when o.days_overdue >= 7 and not exists (select 1 from public.mentorship_checkin_reminder_log r where r.student_id=o.student_id and r.cycle_key=o.cycle_key and r.reminder_stage='overdue_7') then 'overdue_7'
      when o.days_overdue >= 3 and not exists (select 1 from public.mentorship_checkin_reminder_log r where r.student_id=o.student_id and r.cycle_key=o.cycle_key and r.reminder_stage='overdue_3') then 'overdue_3'
      when o.days_overdue >= 0 and not exists (select 1 from public.mentorship_checkin_reminder_log r where r.student_id=o.student_id and r.cycle_key=o.cycle_key and r.reminder_stage='due') then 'due'
      else null
    end as reminder_stage
  from open_due o
)
select
  s.student_id,
  s.display_name,
  split_part(s.display_name,' ',1) as first_name,
  s.email as recipient_email,
  s.checkin_type,
  s.cycle_key,
  s.due_on,
  s.days_overdue,
  s.reminder_stage,
  case
    when s.reminder_stage='due' then 'Your mentorship check-in is ready'
    when s.reminder_stage='overdue_3' then 'Quick reminder: your mentorship check-in'
    else 'Your mentorship check-in is still open'
  end as subject,
  case
    when s.reminder_stage='due' then
      'Hi ' || split_part(s.display_name,' ',1) || E',\n\nYour ' ||
      case s.checkin_type when 'monthly' then 'monthly mentorship pulse' when 'month_3' then '3-month alignment check' when 'month_6' then '6-month development review' else '12-month annual review' end ||
      ' is ready in the Mentorship Hub. ' ||
      case when s.checkin_type='monthly' then 'It should take less than a minute.' else 'It should only take a few minutes.' end ||
      E'\n\nThis helps me see how your training is going and adjust your next steps when needed.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
    when s.reminder_stage='overdue_3' then
      'Hi ' || split_part(s.display_name,' ',1) || E',\n\nQuick reminder that your mentorship check-in is still waiting for you. Your answers help me keep your training aligned with what you actually need right now.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
    else
      'Hi ' || split_part(s.display_name,' ',1) || E',\n\nYour mentorship check-in is still open. When you have a moment, please complete it so I can keep your roadmap and training direction up to date.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
  end as body
from staged s
where s.reminder_stage is not null;

revoke all on public.mentorship_checkin_reminder_queue from public, anon, authenticated;

comment on table public.mentorship_checkin_reminder_log is 'Deduplicates external reminder emails for mentorship check-ins. Only successful sends should be logged.';
comment on view public.mentorship_checkin_reminder_queue is 'Server-side queue of due mentorship check-in reminder emails. Intended for the scheduled ChatGPT Gmail sender.';
