import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
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
    <Card className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[380px] sm:py-16">
      <span
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/[0.09] text-primary"
      >
        <Icon size={26} strokeWidth={2} />
      </span>
      <h2 className="mx-auto mt-5 max-w-sm text-balance text-xl font-extrabold tracking-tight text-ink sm:text-[21px]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-6 text-muted sm:text-[15px]">
        {body}
      </p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_8px_16px_-9px_rgb(128_42_25/0.7)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98]"
      >
        {actionLabel}
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </Card>
  );
}
