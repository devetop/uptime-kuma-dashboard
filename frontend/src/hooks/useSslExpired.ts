import { useCallback, useEffect, useState } from 'react';
import type { SslExpiredItem } from '@shared/index.ts';
import { fetchSslExpired } from '../lib/api';

export interface SslResult {
  state: 'loading' | 'loaded';
  loading: boolean;
  error: string | null;
  data: SslExpiredItem[];
  total: number;
}

export function useSslExpired(pollMs = 5_000): SslResult & {
  reload: () => Promise<void>;
} {
  const [result, setResult] = useState<SslResult>({
    state: 'loading',
    loading: true,
    error: null,
    data: [],
    total: 0,
  });

  const load = useCallback(async () => {
    setResult((prev) =>
      prev.state === 'loading' ? prev : { ...prev, state: 'loaded', error: null },
    );
    try {
      const res = await fetchSslExpired();
      setResult({
        state: 'loaded',
        loading: false,
        error: null,
        data: res.data,
        total: res.total,
      });
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