-- Track the provider's joined-but-not-recording lifecycle state separately.
alter table public.meetings
  drop constraint if exists meetings_status_check;

alter table public.meetings
  add constraint meetings_status_check
  check (status in ('scheduled','joining','in_meeting','in_progress','processing','completed','failed'));
