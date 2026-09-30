import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ListChecks,
  Mic,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonChip } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Mic,
    tint: "bg-primary/10 text-primary",
    title: "Auto-Join Meetings",
    body: "Paste a Google Meet link. The 8xMeetly bot joins, records, and transcribes — you stay focused on the conversation.",
  },
  {
    icon: Sparkles,
    tint: "bg-ink/[0.07] text-ink",
    title: "AI Summaries",
    body: "Concise recaps with key topics and explicit decisions. Grounded in the transcript, never invented.",
  },
  {
    icon: ListChecks,
    tint: "bg-green-100 text-green-700",
    title: "Action Items",
    body: "Commitments and owners extracted automatically, so nothing slips after the call ends.",
  },
  {
    icon: UsersRound,
    tint: "bg-amber-100 text-amber-700",
    title: "Shared Memory",
    body: "Every meeting becomes a searchable archive. Ask AI what anyone said, weeks later.",
  },
];

const STEPS = [
  { n: "01", title: "Paste the Link", body: "Drop any Google Meet URL into 8xMeetly and give the bot a name." },
  { n: "02", title: "Bot Joins & Records", body: "The notetaker joins on time, captures audio, and builds the transcript." },
  { n: "03", title: "AI Writes the Notes", body: "Summary, decisions, and action items land in your dashboard automatically." },
  { n: "04", title: "Search & Ask", body: "Find any moment or ask questions about what was decided." },
];

function ProductVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-16 max-w-3xl sm:mt-20">
      <div className="absolute -top-6 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full bg-peach blur-3xl" />
      {/* Back card: transcript */}
      <div className="absolute inset-x-8 top-10 hidden rotate-[-4deg] rounded-3xl border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgb(27_37_96/0.35)] sm:block">
        <div className="space-y-3 opacity-70">
          {[82, 64, 74].map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-6 w-6 shrink-0 rounded-full bg-ink/10" />
              <div className="h-2.5 rounded-full bg-stone-200" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
      {/* Front card: AI summary */}
      <div className="relative rotate-[1.5deg] rounded-3xl border border-border bg-card p-6 text-left shadow-[0_32px_70px_-28px_rgb(27_37_96/0.45)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[15px] font-bold text-ink">Weekly Product Sync</p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            <CheckCircle2 size={13} strokeWidth={2.5} />
            Completed
          </span>
        </div>
        <p className="mt-1 text-[13px] text-muted">Today · 32 min · 4 action items</p>
        <div className="mt-4 rounded-2xl bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Summary</p>
          <div className="mt-2 space-y-2">
            <div className="h-2.5 w-full rounded-full bg-stone-200" />
            <div className="h-2.5 w-11/12 rounded-full bg-stone-200" />
            <div className="h-2.5 w-3/5 rounded-full bg-stone-200" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Beta ships Friday", "Auth owner: Dan", "Onboarding v2"].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <CheckCircle2 size={12} strokeWidth={2.5} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Floating pill navbar */}
      <div className="sticky top-3 z-50 px-3 sm:top-4">
        <nav
          aria-label="Site"
          className="mx-auto flex max-w-2xl items-center gap-1 rounded-full border border-border/70 bg-card/90 py-2 pl-5 pr-2 shadow-[0_12px_32px_-16px_rgb(27_37_96/0.3)] backdrop-blur"
        >
          <Link href="/" aria-label="8xMeetly home" className="mr-auto">
            <Logo />
          </Link>
          <Link
            href="#features"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-stone-500 transition-[color,background-color] hover:bg-ink/[0.05] hover:text-ink sm:block"
          >
            Features
          </Link>
          <Link
            href="#how"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-stone-500 transition-[color,background-color] hover:bg-ink/[0.05] hover:text-ink sm:block"
          >
            How It Works
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-[border-color,background-color] hover:border-ink/30 hover:bg-background"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-full bg-primary py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white shadow-[0_8px_10px_-6px_rgb(64_48_36/0.41)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98]"
          >
            Get Started
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2b2118]">
              <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </span>
          </Link>
        </nav>
      </div>

      {/* Hero */}
      <section className="px-6 pb-4 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-3xl text-balance text-[42px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          <span className="text-coral">Every Meeting.</span>{" "}
          <span className="text-ink">Notes, Decisions &amp; Action Items.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          8xMeetly joins your Google Meet calls, records the conversation, and
          turns it into summaries your team actually reads.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-[15px] font-semibold text-white shadow-[0_12px_20px_-10px_rgb(64_48_36/0.45)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98] sm:w-auto sm:pl-7"
          >
            Start Taking Notes
            <ButtonChip>
              <UsersRound size={15} strokeWidth={2.25} />
            </ButtonChip>
          </Link>
          <Link
            href="#how"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-2.5 text-[15px] font-semibold text-ink shadow-sm transition-[border-color,background-color,transform] hover:border-ink/30 active:scale-[0.98] sm:w-auto sm:pl-7"
          >
            See How It Works
            <span
              aria-hidden="true"
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.07] text-ink"
            >
              <UserRound size={15} strokeWidth={2.25} />
            </span>
          </Link>
        </div>
        <ProductVisual />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Features
        </p>
        <h2 className="mx-auto mt-3 max-w-xl text-balance text-center text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Your Meetings, Remembered
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-3xl border border-border bg-card p-6 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_44px_-24px_rgb(27_37_96/0.4)] sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${f.tint}`}
                >
                  <Icon size={20} strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-6 pb-20 sm:pb-24">
        <div className="rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            How It Works
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            From Link to Notes in 4 Steps
          </h2>
          <ol className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10">
                <p className="text-sm font-extrabold tabular-nums text-coral">{s.n}</p>
                <h3 className="mt-1.5 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3 text-[15px] font-semibold text-white shadow-[0_12px_20px_-10px_rgb(64_48_36/0.45)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted">
            <span translate="no">8xMeetly</span> · Never take meeting notes again.
          </p>
          <div className="flex gap-5 text-sm font-semibold">
            <Link href="/login" className="text-stone-500 transition-colors hover:text-ink">
              Login
            </Link>
            <Link href="/register" className="text-stone-500 transition-colors hover:text-ink">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
