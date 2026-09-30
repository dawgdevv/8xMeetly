export type MeetingStatus =
  | "scheduled"
  | "joining"
  | "in_meeting"
  | "in_progress"
  | "processing"
  | "completed"
  | "failed";

export type InsightType =
  | "summary"
  | "key_topic"
  | "decision"
  | "action_item";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      meetings: {
        Row: {
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
          transcript_status: string | null;
          summary_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          meeting_url: string;
          bot_id?: string | null;
          status?: MeetingStatus;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          recording_url?: string | null;
          transcript_status?: string | null;
          summary_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          meeting_url?: string;
          bot_id?: string | null;
          status?: MeetingStatus;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          recording_url?: string | null;
          transcript_status?: string | null;
          summary_status?: string | null;
          updated_at?: string;
        };
      };
      transcript_segments: {
        Row: {
          id: string;
          meeting_id: string;
          speaker: string | null;
          speaker_id: string | null;
          text: string;
          start_time: number | null;
          end_time: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          speaker?: string | null;
          speaker_id?: string | null;
          text: string;
          start_time?: number | null;
          end_time?: number | null;
          created_at?: string;
        };
        Update: {
          speaker?: string | null;
          speaker_id?: string | null;
          text?: string;
          start_time?: number | null;
          end_time?: number | null;
        };
      };
      meeting_insights: {
        Row: {
          id: string;
          meeting_id: string;
          type: InsightType;
          content: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          type: InsightType;
          content: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          type?: InsightType;
          content?: string;
          metadata?: Record<string, unknown> | null;
        };
      };
    };
  };
}
