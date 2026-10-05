import { useCallback, useEffect, useState } from 'react';
import type { MonitorView, Result } from '../lib/types';
import { fetchDownMonitors } from '../lib/api';

/**
 * Polling state as a discriminated `Result`. `state === 'loading'` means "no
 * response has ever settled"; once the first attempt finishes the state is
 * 'loaded' for good — a reload only clears `error`, it never re-arms `loading`.
 * Data and total survive a failed attempt, so the dashboard never blanks out.
 */
export function useDownMonitors(pollMs = 5_000): Result<MonitorView> & {
  reload: () => Promise<void>;
} {
  const [result, setResult] = useState<Result<MonitorView>>({
    state: 'loading',
    loading: true,
    error: null,
    data: [],
    total: 0,
  });

  const load = useCallback(async () => {
    setResult((prev) =>
      // The original cleared `error` before awaiting; `loading` was untouched.
      prev.state === 'loading' ? prev : { ...prev, state: 'loaded', error: null },
    );
    try {
      const res = await fetchDownMonitors();
      setResult({ state: 'loaded', loading: false, error: null, data: res.data, total: res.total });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setResult((prev) => ({
        ...prev,
        state: 'loaded',
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { ...result, reload: load };
}
