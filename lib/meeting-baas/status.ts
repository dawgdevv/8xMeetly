import type { MeetingStatus } from "@/types/database";

/** Map Meeting BaaS lifecycle codes to states displayed by 8xMeetly. */
export function statusFromBaasCode(code: string): MeetingStatus | null {
  switch (code) {
    case "queued":
    case "pickup_delayed":
    case "joining_call":
    case "in_waiting_room":
    case "in_waiting_for_host":
      return "joining";
    case "in_call_not_recording":
      return "in_meeting";
    case "in_call_recording":
    case "recording_paused":
    case "recording_resumed":
      return "in_progress";
    case "call_ended":
    case "recording_succeeded":
    case "transcribing":
    case "completed":
      return "processing";
    case "recording_failed":
    case "meeting_error":
    case "api_request_stop":
    case "bot_rejected":
    case "bot_removed":
    case "bot_removed_too_early":
    case "waiting_room_timeout":
    case "invalid_meeting_url":
    case "failed":
      return "failed";
    default:
      return null;
  }
}
