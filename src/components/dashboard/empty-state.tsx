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
    <Card className="px-6 py-12 text-center sm:py-16">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary"
      >
        <Icon size={26} strokeWidth={2} />
      </span>
      <h2 className="mx-auto mt-5 max-w-sm text-balance text-xl font-extrabold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted">
        {body}
      </p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(206_68_24/0.6)] transition-[background-color,transform] hover:bg-[#b53b14] active:scale-[0.98]"
      >
        {actionLabel}
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </Card>
  );
}
