import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { GoogleButton } from "@/components/auth/google-button";
import { OAuthNotice } from "@/components/auth/oauth-notice";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-10rem] h-80 w-[min(90vw,56rem)] -translate-x-1/2 rounded-full bg-peach/45 blur-3xl" />
      <Link href="/" aria-label="8xMeetly home">
        <Logo />
      </Link>
      <Card className="relative mt-8 w-full max-w-md p-6 shadow-[0_24px_70px_-42px_rgb(41_39_33/0.5)] sm:p-8">
        <BackButton label="Home" fallbackHref="/" />
        <h1 className="mt-5 text-balance text-center text-[26px] font-extrabold tracking-[-0.03em] text-ink">
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
