"use client";

import { useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field, FormStatus } from "@/components/ui/field";
import { GoogleButton } from "@/components/auth/google-button";
import { OAuthNotice } from "@/components/auth/oauth-notice";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Check your credentials and try again.`
          : "Login failed. Check your credentials and try again."
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
          Welcome Back
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted">
          Log in to your 8xMeetly workspace
        </p>
        <Suspense>
          <OAuthNotice />
        </Suspense>
        <div className="mt-6">
          <GoogleButton label="Continue with Google" />
        </div>
        <div aria-hidden="true" className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            or with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <form className="space-y-4" onSubmit={onSubmit} noValidate={false}>
          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
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
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password…"
            />
          </Field>
          <FormStatus error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />}
            {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Get started
          </Link>
        </p>
      </Card>
    </div>
  );
}
