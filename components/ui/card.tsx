import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-border bg-card text-card-foreground",
        "shadow-[0_1px_2px_rgb(27_37_96/0.05),0_16px_40px_-24px_rgb(27_37_96/0.22)]",
        className
      )}
      {...props}
    />
  );
}
