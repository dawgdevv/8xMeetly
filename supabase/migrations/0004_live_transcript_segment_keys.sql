-- Keep live transcript finals idempotent across WebSocket reconnects and
-- reconcile them with the provider's final post-call transcript artifact.
alter table public.transcript_segments
  add column if not exists provider_segment_key text;

alter table public.transcript_segments
  add column if not exists is_final boolean not null default true;

create unique index if not exists transcript_provider_segment_key_uidx
  on public.transcript_segments (provider_segment_key);
