import { useState, useEffect, useCallback } from 'react';
import type { DownMonitor } from '@shared/index.ts';
import { fetchDownMonitors } from '../lib/api';

export function useDownMonitors(pollMs = 30_000) {
  const [data, setData] = useState<DownMonitor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchDownMonitors();
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, total, loading, error, reload: load };
}