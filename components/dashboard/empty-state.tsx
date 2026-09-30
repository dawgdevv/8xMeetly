import Link from "next/link";
import { ArrowRight, Check, FileText, ListChecks, Sparkles, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="grid overflow-hidden p-3 sm:p-4 md:min-h-[320px] md:grid-cols-[0.9fr_1.1fr] md:items-stretch md:gap-8 md:p-5 lg:gap-12 lg:p-6">
      <div
        aria-hidden="true"
        className="relative flex min-h-[190px] items-center justify-center overflow-hidden rounded-[16px] bg-[radial-gradient(ellipse_at_50%_25%,rgb(255_220_178/0.72),transparent_68%),linear-gradient(145deg,#fcf0e8,#f7f2e8)] sm:min-h-[220px] md:min-h-0"
      >
        <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.09] sm:h-52 sm:w-52" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.12] bg-white/30 sm:h-40 sm:w-40" />
        <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-white text-primary shadow-[0_14px_36px_-18px_rgb(128_42_25/0.4)] ring-1 ring-white/80 sm:h-[88px] sm:w-[88px]">
          <Icon size={34} strokeWidth={1.9} />
        </div>
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-bold text-ink shadow-sm sm:bottom-5 sm:left-5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check size={13} strokeWidth={3} />
          </span>
          Notes, ready after every call
        </div>
      </div>

      <div className="flex flex-col justify-center px-3 py-7 text-center sm:px-6 sm:py-9 md:px-3 md:text-left lg:py-10">
        <p className="mx-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary md:mx-0">
          <Sparkles size={14} strokeWidth={2.4} aria-hidden="true" />
          Your workspace is ready
        </p>
        <h2 className="mx-auto mt-3 max-w-md text-balance text-[23px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[27px] md:mx-0 lg:text-[30px]">
          {title}
        </h2>
        <p className="mx-auto mt-2.5 max-w-lg text-pretty text-sm leading-6 text-muted sm:text-[15px] md:mx-0">
          {body}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-stone-600">
            <FileText size={14} aria-hidden="true" />
            Clear summaries
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-stone-600">
            <ListChecks size={14} aria-hidden="true" />
            Action items
          </span>
        </div>
        <div className="mt-6 flex justify-center md:justify-start">
          <Link
            href={actionHref}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_8px_16px_-9px_rgb(128_42_25/0.7)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98]"
          >
            {actionLabel}
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
