import { useEffect, useState } from 'react';

/** Ticks once a second so relative timestamps re-render without re-fetching. */
export function useTicker(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
