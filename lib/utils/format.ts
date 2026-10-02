const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatMeetingDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatMeetingDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatMeetingTitle(title: string | null | undefined, createdAt: Date | string): string {
  const cleanedTitle = title?.trim();
  return cleanedTitle || `Google Meet · ${formatMeetingDate(createdAt)}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
