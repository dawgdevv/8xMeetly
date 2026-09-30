"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LoaderCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Field, FormStatus } from "@/components/ui/field";

export default function AskPage() {
  const params = useParams<{ id: string }>();
  const meetingId = params.id;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAnswer(null);
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ask failed.");
      setAnswer(json.answer);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Try asking again.`
          : "Could not answer. Try asking again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <BackButton fallbackHref={`/dashboard/meetings/${meetingId}`} />
      <h1 className="mt-4 text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
        Ask AI
      </h1>
      <p className="mb-6 mt-2 text-pretty text-sm leading-6 text-muted sm:text-[15px]">
        Ask anything about this meeting. Answers come straight from the transcript.
      </p>
      <Card className="p-5 sm:p-7">
        <form onSubmit={ask} className="space-y-4">
          <Field label="Your Question" htmlFor="ask-question">
            <Textarea
              id="ask-question"
              name="question"
              rows={3}
              autoComplete="off"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What did the team decide about the launch…"
            />
          </Field>
          <FormStatus error={error} />
          <Button type="submit" size="pill" disabled={loading || !question.trim()}>
            {loading ? (
              <>
                <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                Ask
                <Send size={16} strokeWidth={2.25} aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
        {answer && (
          <div
            aria-live="polite"
            className="mt-6 rounded-2xl bg-background p-5 ring-1 ring-border"
          >
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles size={13} aria-hidden="true" />
              Answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-pretty text-[15px] leading-relaxed text-stone-700">
              {answer}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
