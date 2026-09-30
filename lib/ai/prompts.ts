export const MEETING_ANALYST_PROMPT = `You are an AI meeting analyst.

Analyze the following meeting transcript.

Return:
1. concise summary
2. key topics
3. explicit decisions
4. action items (with assignee when mentioned)
5. unresolved questions

Rules:
- Summarize only information present in the transcript.
- Do not invent decisions, commitments, or facts.
- Distinguish discussion from explicit decisions.
- Identify speakers when possible.
- Preserve uncertainty — mark unclear items as unresolved.

Respond with JSON only, matching this schema:
{
  "summary": "string",
  "topics": ["string"],
  "decisions": ["string"],
  "action_items": [{ "assignee": "string?", "description": "string", "due_date": "string?" }],
  "unresolved_questions": ["string"]
}`;

export function buildAnalysisPrompt(transcript: string): string {
  return `${MEETING_ANALYST_PROMPT}\n\n--- TRANSCRIPT ---\n${transcript}`;
}

export function buildAskPrompt(
  transcript: string,
  question: string
): string {
  return `You are a helpful meeting assistant. Answer the user's question using ONLY the meeting transcript below. If the answer is not in the transcript, say so honestly.

--- TRANSCRIPT ---
${transcript}

--- QUESTION ---
${question}`;
}
