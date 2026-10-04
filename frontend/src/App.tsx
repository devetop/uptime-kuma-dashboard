import { useEffect, useMemo, useState } from 'react';
import type { CountState, LiveSlot, MonitorView } from './lib/types';
import { useDownMonitors } from './hooks/useDownMonitors';
import { useTheme } from './hooks/useTheme';
import { useTicker } from './hooks/useTicker';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { LiveState } from './components/LiveState';
import { MonitorCards } from './components/MonitorCards';
import { MonitorTable } from './components/MonitorTable';

export function App() {
  const now = useTicker(1_000);
  const { data, total, loading, error, reload } = useDownMonitors(30_000);
  const { isDark, toggleTheme } = useTheme();

  const [filter, setFilter] = useState('');
  const query = filter.trim();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return data;
    return data.filter(
      (m: MonitorView) =>
        m.monitor_name.toLowerCase().includes(q) || (m.msg ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

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

  /** One empty message, used by both the card list and the table. */
  const emptyMessage = query
    ? `No down monitors match “${query}”.`
    : unknown
      ? 'No monitor data available.'
      : 'All monitors are up.';

  const refresh = () => void reload();
  const clearFilter = () => setFilter('');
  const surface = { firstLoad, query, emptyMessage, onClearFilter: clearFilter, now };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        count={count}
        loading={loading}
        isDark={isDark}
        onRefresh={refresh}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error !== null && <ErrorBanner error={error} onRetry={refresh} />}

        <div className="mb-4">
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

        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm leading-5 text-slate-700 dark:text-slate-300">
          <span>
            Showing <span className="font-mono font-semibold tabular-nums">{filtered.length}</span>{' '}
            of <span className="font-mono tabular-nums">{total}</span> down
          </span>
          <span className="font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400">
            <LiveState slot={slot} />
          </span>
        </div>

        {/* One live region so state is announced once, not per surface. */}
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {firstLoad
            ? 'Loading down monitors'
            : loading
              ? 'Refreshing down monitors'
              : filtered.length === 0
                ? `${emptyMessage}`
                : `${filtered.length} of ${total} down monitors shown`}
        </p>

        {/* Data surface: cards below 45rem, table at >= 45rem. No horizontal scroll. */}
        <section
          aria-label="Down monitors"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <MonitorCards rows={filtered} {...surface} />
          <MonitorTable rows={filtered} {...surface} />
        </section>
      </main>
    </div>
  );
}
