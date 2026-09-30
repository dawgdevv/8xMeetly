import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { GoogleButton } from "@/components/auth/google-button";

const PERKS = [
  "Unlimited meetings during beta",
  "AI summaries, decisions & action items",
  "Searchable transcript archive",
];

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-10rem] h-80 w-[min(90vw,56rem)] -translate-x-1/2 rounded-full bg-peach/45 blur-3xl" />
      <Link href="/" aria-label="8xMeetly home">
        <Logo />
      </Link>
      <Card className="relative mt-8 w-full max-w-md p-6 shadow-[0_24px_70px_-42px_rgb(41_39_33/0.5)] sm:p-8">
        <BackButton label="Home" fallbackHref="/" />
        <h1 className="mt-5 text-balance text-center text-[26px] font-extrabold tracking-[-0.03em] text-ink">
          Create Your Account
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted">
          Start capturing meetings in under a minute
        </p>
        <ul className="mt-5 space-y-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-sm text-stone-600">
              <CheckCircle2
                size={17}
                strokeWidth={2.5}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-green-600"
              />
              <span className="min-w-0">{perk}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <GoogleButton label="Sign up with Google" />
        </div>
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
