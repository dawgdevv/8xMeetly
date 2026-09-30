-- Meetly AI — Phase 1 schema (PRD §9, §13, §16, §23)
-- Run with: supabase db push (or paste into Supabase SQL editor)

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Meetings
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  meeting_url text not null,
  bot_id text,
  status text not null default 'scheduled'
    check (status in ('scheduled','joining','in_progress','processing','completed','failed')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  transcript_status text,
  summary_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists meetings_user_id_idx on public.meetings (user_id);
create index if not exists meetings_bot_id_idx on public.meetings (bot_id);

-- Transcript segments
create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  speaker text,
  speaker_id text,
  text text not null,
  start_time double precision,
  end_time double precision,
  created_at timestamptz not null default now()
);
create index if not exists transcript_meeting_idx on public.transcript_segments (meeting_id);

-- AI insights (summary / key_topic / decision / action_item)
create table if not exists public.meeting_insights (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  type text not null
    check (type in ('summary','key_topic','decision','action_item')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists insights_meeting_idx on public.meeting_insights (meeting_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', null)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: users see only their own rows
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.meeting_insights enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

drop policy if exists "own meetings" on public.meetings;
create policy "own meetings" on public.meetings
  for all using (auth.uid() = user_id);

drop policy if exists "own transcripts" on public.transcript_segments;
create policy "own transcripts" on public.transcript_segments
  for all using (
    exists (select 1 from public.meetings m
            where m.id = transcript_segments.meeting_id
              and m.user_id = auth.uid())
  );

drop policy if exists "own insights" on public.meeting_insights;
create policy "own insights" on public.meeting_insights
  for all using (
    exists (select 1 from public.meetings m
            where m.id = meeting_insights.meeting_id
              and m.user_id = auth.uid())
  );
