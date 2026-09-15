alter table public.mentorship_operations
  add column if not exists started_on_source text,
  add column if not exists started_on_confidence text
    check (started_on_confidence is null or started_on_confidence in ('high','medium','low'));

comment on column public.mentorship_operations.started_on_source is
  'Human-readable provenance for mentorship start date, such as earliest explicit mentorship note or calendar activity.';
comment on column public.mentorship_operations.started_on_confidence is
  'Confidence that started_on approximates the actual mentorship start date.';
