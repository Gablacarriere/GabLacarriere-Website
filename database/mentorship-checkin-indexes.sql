create index if not exists mentorship_checkin_suggestions_checkin_idx
  on public.mentorship_checkin_suggestions(checkin_id);

create index if not exists mentorship_checkin_suggestions_decided_by_idx
  on public.mentorship_checkin_suggestions(decided_by)
  where decided_by is not null;

create index if not exists mentorship_checkins_reviewed_by_idx
  on public.mentorship_checkins(reviewed_by)
  where reviewed_by is not null;
