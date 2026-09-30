"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

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
      setError(err instanceof Error ? err.message : "Ask failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/dashboard/meetings/${meetingId}`} className="text-sm text-muted hover:text-foreground">
        ← Back to overview
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Ask AI</h1>
      <Card className="p-6">
        <form onSubmit={ask} className="space-y-4">
          <Textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What did Alex say about the launch?"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={loading || !question.trim()}>
            {loading ? "Thinking…" : "Ask"}
          </Button>
        </form>
        {answer && (
          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
