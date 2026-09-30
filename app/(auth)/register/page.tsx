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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" aria-label="8xMeetly home">
        <Logo />
      </Link>
      <Card className="mt-8 w-full max-w-md p-7 sm:p-8">
        <BackButton label="Home" fallbackHref="/" />
        <h1 className="mt-4 text-balance text-center text-2xl font-extrabold tracking-tight text-ink">
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
