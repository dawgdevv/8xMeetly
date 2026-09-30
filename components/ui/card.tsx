import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border/90 bg-card text-card-foreground",
        "shadow-[0_1px_2px_rgb(41_39_33/0.04),0_12px_32px_-25px_rgb(41_39_33/0.34)]",
        className
      )}
      {...props}
    />
  );
}
