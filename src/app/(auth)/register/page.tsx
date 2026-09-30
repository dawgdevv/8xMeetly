"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field, FormStatus } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Fix it and try again.`
          : "Registration failed. Fix the highlighted fields and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" aria-label="8xMeetly home">
        <Logo />
      </Link>
      <Card className="mt-8 w-full max-w-md p-7 sm:p-8">
        <h1 className="text-balance text-center text-2xl font-extrabold tracking-tight text-ink">
          Create Your Account
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted">
          Start capturing meetings in under a minute
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Name" htmlFor="register-name">
            <Input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jordan Smith…"
            />
          </Field>
          <Field label="Email" htmlFor="register-email">
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com…"
            />
          </Field>
          <Field label="Password" htmlFor="register-password" hint="8+ characters recommended.">
            <Input
              id="register-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password…"
            />
          </Field>
          <FormStatus error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />}
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
