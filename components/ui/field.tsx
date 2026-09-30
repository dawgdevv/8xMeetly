import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-2 text-[13px] leading-5 text-muted">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormStatus({
  error,
  className,
}: {
  error: string | null;
  className?: string;
}) {
  if (!error) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className={cn("text-sm font-medium text-red-600", className)}
    >
      {error}
    </p>
  );
}
