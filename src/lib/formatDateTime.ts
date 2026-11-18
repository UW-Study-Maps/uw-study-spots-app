/** "Sep 9 at 3:45 PM" — matches the website's Updates log formatting. */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} at ${timeLabel}`;
}

/** "4 min ago" / "1 hr ago" — matches the website's busyness-status formatting. */
export function formatRelativeTime(ts: number): string {
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
}

/** "12 min" — a duration (not a point in time), rounded up so "almost done" never reads as "0 min". */
export function formatDuration(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return minutes <= 1 ? "1 min" : `${minutes} min`;
}

/** 0 = Monday … 6 = Sunday — lines up with Google Places' weekdayDescriptions order. */
export function mondayFirstDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}
