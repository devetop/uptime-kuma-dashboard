import { useEffect, useMemo, useState } from 'react';
import type { CountState, LiveSlot } from './lib/types';
import { useDownMonitors } from './hooks/useDownMonitors';
import { useTheme } from './hooks/useTheme';
import { useTicker } from './hooks/useTicker';
import { filterRows, useCategoryCounts, useToggleSet } from './hooks/useFilters';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { FilterRail } from './components/FilterRail';
import { MonitorRecords } from './components/MonitorRecords';

export function App() {
  const now = useTicker(1_000);
  const { data, total, loading, error, reload } = useDownMonitors(5_000);
  const { isDark, toggleTheme } = useTheme();

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

  /**
   * Wall-clock of the last successful response. Polling replaces `data`, so this
   * tracks real refreshes instead of the 1s tick used for relative labels.
   */
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    setUpdatedAt(Date.now());
  }, [data]);

  // Narrow the fetch state once; every surface below reads a finished decision.
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

  /* Honesty rule: "All monitors are up" is claimed only from a settled empty
     payload — never from a filter hiding rows, never from a failed load. */
  const emptyMessage = unknown
    ? 'No monitor data available.'
    : filtersOn
      ? `No down monitors match${types.any ? ' these filters' : ` “${query}”`}.`
      : 'All monitors are up.';

  const refresh = () => void reload();
  const clearFilters = () => {
    setFilter('');
    types.clear();
  };
  const surface = {
    firstLoad,
    filtersOn,
    emptyMessage,
    onClearFilter: clearFilters,
    now,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        slot={slot}
        loading={loading}
        isDark={isDark}
        onRefresh={refresh}
        onToggleTheme={toggleTheme}
      />

      {/* Console: rail + list side by side at >= 45rem; under that the rail
          re-flows into a horizontal chip band above the list (same content). */}
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 wide:grid-cols-[15rem_minmax(0,1fr)]">
        <FilterRail count={count} cats={cats} active={types.active} onToggle={types.toggle} />

        <main className="flex min-w-0 flex-col gap-3">
          {error !== null && <ErrorBanner error={error} onRetry={refresh} />}

          <div>
            <label
              htmlFor="monitor-filter"
              className="mb-1 block text-sm leading-5 font-medium text-slate-700 dark:text-slate-300"
            >
              Filter by monitor name or error message
            </label>
            <input
              id="monitor-filter"
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm leading-5 text-slate-900 transition-colors focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-blue-400"
            />
          </div>

          <p className="text-sm leading-5 text-slate-700 dark:text-slate-300">
            Showing{' '}
            <span className="font-mono font-semibold tabular-nums">{filtered.length}</span> of{' '}
            <span className="font-mono tabular-nums">{total}</span> down
          </p>

          {/* One live region so state is announced once, not per surface. */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {firstLoad
              ? 'Loading down monitors'
              : loading
                ? 'Refreshing down monitors'
                : filtered.length === 0
                  ? emptyMessage
                  : `${filtered.length} of ${total} down monitors shown`}
          </p>

          <section aria-label="Down monitors">
            <MonitorRecords rows={filtered} {...surface} />
          </section>
        </main>
      </div>
    </div>
  );
}
