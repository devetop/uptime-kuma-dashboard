import { useEffect, useMemo, useState } from 'react';
import type { QuickStats } from '@shared/index.ts';
import type { CountState, LiveSlot, MonitorView } from '../lib/types';
import { filterRows, useCategoryCounts, useToggleSet } from './useFilters';

/**
 * Dashboard derived state, lifted out of App so the root stays a composition
 * point. Owns the filter set, the three header state machines and the KPI
 * denominators — everything App would otherwise compute inline.
 */
export function useDashboardState(
  data: MonitorView[],
  total: number,
  stats: QuickStats | null,
  loading: boolean,
  error: string | null,
  now: number,
) {
  const [filter, setFilter] = useState('');
  const query = filter.trim();
  const cats = useCategoryCounts(data);
  const types = useToggleSet();
  const filtersOn = query !== '' || types.any;

  const filtered = useMemo(
    () => filterRows(data, query, types.active),
    [data, query, types.active],
  );

  const firstLoad = loading && data.length === 0;

  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    setUpdatedAt(Date.now());
  }, [data]);

  const unknown = Boolean(error) && data.length === 0;
  const count: CountState = firstLoad
    ? { state: 'skeleton' }
    : unknown
      ? { state: 'unknown' }
      : { state: 'count', total };

  const slot: LiveSlot = firstLoad
    ? { state: 'loading' }
    : loading
      ? { state: 'refreshing' }
      : updatedAt === null
        ? { state: 'no-data' }
        : { state: 'updated', at: updatedAt };

  const emptyMessage = unknown
    ? 'No monitor data available.'
    : filtersOn
      ? `No down monitors match${types.any ? ' these filters' : ` “${query}”`}.`
      : 'All monitors are up.';

  const clearFilters = () => {
    setFilter('');
    types.clear();
  };

  // Global Uptime is still a mock (AGENTS.md); the string only feeds the card.
  const globalUptime = total === 0 ? '99.98%' : total === 1 ? '99.28%' : '98.45%';

  // Shared denominator for the Up / Down / Paused bars.
  const totalMonitors = Math.max(
    (stats?.up ?? 0) + (stats?.down ?? 0) + (stats?.pause ?? 0),
    total,
    1,
  );

  return {
    filter,
    setFilter,
    query,
    cats,
    types,
    filtersOn,
    filtered,
    firstLoad,
    count,
    slot,
    clearFilters,
    globalUptime,
    totalMonitors,
    /** Props bundle for MonitorRecords — stable identity per render is fine here. */
    surface: { firstLoad, filtersOn, emptyMessage, onClearFilter: clearFilters, now },
  };
}

/** Count of records expiring inside the critical window (<= 7 days). */
export function useCriticalCount(items: readonly { days_left: number }[]): number {
  return useMemo(() => items.filter((i) => i.days_left <= 7).length, [items]);
}
