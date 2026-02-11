export function formatTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function formatLocalTime(
  epochMs: number,
  tzOffsetMinutes: number | null,
): string {
  if (tzOffsetMinutes === null) {
    return "Timezone data unavailable";
  }

  const localMs = epochMs + tzOffsetMinutes * 60 * 1000;
  const localDate = new Date(localMs);

  const hours = localDate.getUTCHours().toString().padStart(2, "0");
  const minutes = localDate.getUTCMinutes().toString().padStart(2, "0");
  const seconds = localDate.getUTCSeconds().toString().padStart(2, "0");

  const offsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
  const offsetMins = Math.abs(tzOffsetMinutes) % 60;
  const sign = tzOffsetMinutes >= 0 ? "+" : "-";
  const offsetStr = `UTC${sign}${offsetHours}${offsetMins > 0 ? `:${offsetMins.toString().padStart(2, "0")}` : ""}`;

  return `${hours}:${minutes}:${seconds} (${offsetStr})`;
}

export function getTimeAgo(epochMs: number): string {
  const now = Date.now();
  const diffMs = now - epochMs;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
