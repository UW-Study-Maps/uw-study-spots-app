/** "Sep 9 at 3:45 PM" — matches the website's Updates log formatting. */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} at ${timeLabel}`;
}
