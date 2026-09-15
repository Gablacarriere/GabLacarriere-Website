-- Keep the reminder queue aligned to New York local dates, use mentorship roster names,
-- stagger the initial rollout, and time follow-ups from the previous successful send.
create or replace view public.mentorship_checkin_reminder_queue as
with settings as (
  select (now() at time zone 'America/New_York')::date as local_today,
         '2026-09-14'::date as rollout_date
),
latest_ops as (
  select distinct on (mo.student_id)
         mo.student_id,
         mo.student_name,
         mo.started_on,
         mo.membership_status
    from public.mentorship_operations mo
   where mo.student_id is not null
     and mo.membership_status in ('active','advance_paid')
   order by mo.student_id, mo.updated_at desc, mo.created_at desc
),
base as (
  select p.id as student_id,
         coalesce(nullif(btrim(o.student_name),''),nullif(btrim(p.display_name),''),split_part(p.email,'@',1),'Student') as display_name,
         p.email,
         coalesce(o.started_on,p.created_at::date) as started_on,
         greatest(0,
           extract(year from age(s.local_today,coalesce(o.started_on,p.created_at::date)))::int*12 +
           extract(month from age(s.local_today,coalesce(o.started_on,p.created_at::date)))::int
         ) as elapsed_months
    from latest_ops o
    join public.profiles p on p.id=o.student_id
    cross join settings s
   where p.role='mentee'
     and p.email is not null
     and btrim(p.email)<>''
),
next_due as (
  select b.*,
    case
      when b.elapsed_months>=12 and not exists(select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_12') then 'month_12'
      when b.elapsed_months>=6 and b.elapsed_months<12 and not exists(select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_6') then 'month_6'
      when b.elapsed_months>=3 and b.elapsed_months<6 and not exists(select 1 from public.mentorship_checkins c where c.student_id=b.student_id and c.checkin_type='month_3') then 'month_3'
      when b.elapsed_months>=1 then 'monthly'
      else null
    end as checkin_type
  from base b
),
dated0 as (
  select n.*,
    case n.checkin_type
      when 'month_3' then (n.started_on + interval '3 months')::date
      when 'month_6' then (n.started_on + interval '6 months')::date
      when 'month_12' then (n.started_on + interval '1 year')::date
      when 'monthly' then (n.started_on + ((n.elapsed_months::text || ' months')::interval))::date
      else null
    end as natural_due_on
  from next_due n
  where n.checkin_type is not null
),
dated as (
  select d.*,
         greatest(d.natural_due_on,s.rollout_date) as due_on,
         case
           when d.natural_due_on <= s.rollout_date
             then s.rollout_date + (get_byte(decode(replace(d.student_id::text,'-',''),'hex'),0) % 7)
           else d.natural_due_on
         end as send_on
    from dated0 d
    cross join settings s
),
cycles as (
  select d.*,
    case d.checkin_type
      when 'month_3' then 'milestone:3'
      when 'month_6' then 'milestone:6'
      when 'month_12' then 'milestone:12'
      when 'monthly' then 'monthly:'||to_char(d.due_on,'YYYY-MM')
      else null
    end as cycle_key
  from dated d
),
open_due as (
  select c.*,
         s.local_today-c.due_on as days_overdue,
         dl.sent_at as due_sent_at,
         r3.sent_at as overdue3_sent_at,
         r7.sent_at as overdue7_sent_at
    from cycles c
    cross join settings s
    left join lateral (
      select min(r.sent_at) as sent_at
      from public.mentorship_checkin_reminder_log r
      where r.student_id=c.student_id and r.cycle_key=c.cycle_key and r.reminder_stage='due'
    ) dl on true
    left join lateral (
      select min(r.sent_at) as sent_at
      from public.mentorship_checkin_reminder_log r
      where r.student_id=c.student_id and r.cycle_key=c.cycle_key and r.reminder_stage='overdue_3'
    ) r3 on true
    left join lateral (
      select min(r.sent_at) as sent_at
      from public.mentorship_checkin_reminder_log r
      where r.student_id=c.student_id and r.cycle_key=c.cycle_key and r.reminder_stage='overdue_7'
    ) r7 on true
   where c.send_on<=s.local_today
     and not exists(select 1 from public.mentorship_checkins ci where ci.student_id=c.student_id and ci.cycle_key=c.cycle_key)
     and not (
       c.checkin_type='monthly' and exists(
         select 1 from public.mentorship_checkins cm
          where cm.student_id=c.student_id
            and to_char(cm.completed_at at time zone 'America/New_York','YYYY-MM')=to_char(s.local_today,'YYYY-MM')
       )
     )
),
staged as (
  select o.*,
    case
      when o.due_sent_at is null then 'due'
      when o.overdue3_sent_at is null
           and (now() at time zone 'America/New_York')::date >= (o.due_sent_at at time zone 'America/New_York')::date + 3 then 'overdue_3'
      when o.overdue3_sent_at is not null and o.overdue7_sent_at is null
           and (now() at time zone 'America/New_York')::date >= (o.overdue3_sent_at at time zone 'America/New_York')::date + 4 then 'overdue_7'
      else null
    end as reminder_stage
  from open_due o
)
select student_id,
       display_name,
       split_part(display_name,' ',1) as first_name,
       email as recipient_email,
       checkin_type,
       cycle_key,
       due_on,
       days_overdue,
       reminder_stage,
       case reminder_stage
         when 'due' then 'Your mentorship check-in is ready'
         when 'overdue_3' then 'Quick reminder: your mentorship check-in'
         else 'Your mentorship check-in is still open'
       end as subject,
       case reminder_stage
         when 'due' then
           'Hi '||split_part(display_name,' ',1)||E',\n\nYour '||
           case checkin_type
             when 'monthly' then 'monthly mentorship pulse'
             when 'month_3' then '3-month alignment check'
             when 'month_6' then '6-month development review'
             else '12-month annual review'
           end||' is ready in the Mentorship Hub. '||
           case when checkin_type='monthly' then 'It should take less than a minute.' else 'It should only take a few minutes.' end||
           E'\n\nThis helps me see how your training is going and adjust your next steps when needed.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
         when 'overdue_3' then
           'Hi '||split_part(display_name,' ',1)||E',\n\nQuick reminder that your mentorship check-in is still waiting for you. Your answers help me keep your training aligned with what you actually need right now.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
         else
           'Hi '||split_part(display_name,' ',1)||E',\n\nYour mentorship check-in is still open. When you have a moment, please complete it so I can keep your roadmap and training direction up to date.\n\nOpen your check-in: https://gablacarriere.com/mentorship-hub.html\n\n— Gab'
       end as body,
       send_on
from staged
where reminder_stage is not null;
