import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { GoogleButton } from "@/components/auth/google-button";
import { OAuthNotice } from "@/components/auth/oauth-notice";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" aria-label="8xMeetly home">
        <Logo />
      </Link>
      <Card className="mt-8 w-full max-w-md p-7 sm:p-8">
        <BackButton label="Home" fallbackHref="/" />
        <h1 className="mt-4 text-balance text-center text-2xl font-extrabold tracking-tight text-ink">
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
        <p className="mt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
