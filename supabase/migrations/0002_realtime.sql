-- Meetly AI — Phase 2: Realtime publication for live meeting pages.
-- The meeting detail page subscribes to its own meeting, transcript
-- segments, and insights, so status/AI notes appear without refresh.

alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.transcript_segments;
alter publication supabase_realtime add table public.meeting_insights;
