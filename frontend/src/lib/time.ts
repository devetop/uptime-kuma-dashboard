/**
 * Human-readable relative time, e.g. "12 minutes ago".
 * `now` is injectable so the caller can force re-renders on a tick
 * without the label drifting between rows.
 */
export function relativeTime(epochSeconds: number, now: number = Date.now()): string {
  const diffMs = now - epochSeconds * 1000;
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);

  const sec = Math.round(abs / 1000);
  const min = Math.round(abs / 60_000);
  const hr  = Math.round(abs / 3_600_000);
  const day = Math.round(abs / 86_400_000);

  let unit: string;
  if (sec < 60)            unit = `${sec} second${sec === 1 ? '' : 's'}`;
  else if (min < 60)       unit = `${min} minute${min === 1 ? '' : 's'}`;
  else if (hr < 24)        unit = `${hr} hour${hr === 1 ? '' : 's'}`;
  else if (day < 30)       unit = `${day} day${day === 1 ? '' : 's'}`;
  else                     unit = `${Math.round(day / 30)} month${Math.round(day / 30) === 1 ? '' : 's'}`;

  return future ? `in ${unit}` : `${unit} ago`;
}

/** Absolute local timestamp for tooltips, e.g. "12/09/2026, 09:23:00" */
export function absoluteTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
