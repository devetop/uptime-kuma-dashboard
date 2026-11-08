import { useCallback, useEffect, useState } from 'react';
import type { DomainExpiredItem } from '@shared/index.ts';
import { fetchDomainExpired } from '../lib/api';

export interface DomainResult {
  state: 'loading' | 'loaded';
  loading: boolean;
  error: string | null;
  data: DomainExpiredItem[];
  total: number;
  activeDomainsMonitored: number;
}

export function useDomainExpired(pollMs = 5_000): DomainResult & {
  reload: () => Promise<void>;
} {
  const [result, setResult] = useState<DomainResult>({
    state: 'loading',
    loading: true,
    error: null,
    data: [],
    total: 0,
    activeDomainsMonitored: 0,
  });

  const load = useCallback(async () => {
    setResult((prev) =>
      prev.state === 'loading' ? prev : { ...prev, state: 'loaded', error: null },
    );
    try {
      const res = await fetchDomainExpired();
      setResult({
        state: 'loaded',
        loading: false,
        error: null,
        data: res.data,
        total: res.total,
        activeDomainsMonitored: res.active_domains_monitored,
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