import type { MeetingStatus } from "./database";

export interface Meeting {
  id: string;
  user_id: string;
  title: string | null;
  meeting_url: string;
  bot_id: string | null;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker: string | null;
  text: string;
  start_time: number | null;
  end_time: number | null;
}

export interface MeetingInsight {
  id: string;
  meeting_id: string;
  type: "summary" | "key_topic" | "decision" | "action_item";
  content: string;
  metadata: Record<string, unknown> | null;
}

export interface MeetingSummary {
  summary: string;
  topics: string[];
  decisions: string[];
  action_items: Array<{
    assignee?: string;
    description: string;
    due_date?: string;
  }>;
  unresolved_questions: string[];
}
