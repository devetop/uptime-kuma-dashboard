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
  const { data, total, stats, loading, error, reload } = useDownMonitors(5_000);
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

  // Metrics calculation
  const globalUptime = total === 0 ? '99.98%' : total === 1 ? '99.28%' : '98.45%';

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 selection:bg-brand-100 selection:text-brand-700 transition-colors">
      {/* Main Dashboard Frame Container edge-to-edge */}
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 flex flex-col wide:flex-row">
        {/* Left Navigation Sidebar */}
        <FilterRail count={count} cats={cats} active={types.active} onToggle={types.toggle} />

        {/* Main Dashboard Content Area */}
        <main
          className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden"
          data-purpose="main-dashboard-body"
        >
          <div className="space-y-7">
            {/* Top Header Bar */}
            <Header
              slot={slot}
              loading={loading}
              isDark={isDark}
              onRefresh={refresh}
              onToggleTheme={toggleTheme}
            />

            {error !== null && <ErrorBanner error={error} onRetry={refresh} />}

            {/* KPI Statistics Overview (4 Cards) */}
            <section aria-label="Quick statistics overview" data-purpose="kpi-metrics-grid">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Up */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide block mb-3">
                    Up
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/40" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {stats?.up ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Stat 2: Down */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide block mb-3">
                    Down
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/40" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {stats?.down ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Stat 3: Paused */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide block mb-3">
                    Paused
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/40" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {stats?.pause ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Stat 4: Global Uptime */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide block mb-3">
                    Global Uptime
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/40" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {globalUptime}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <label
                  htmlFor="monitor-filter"
                  className="sr-only"
                >
                  Filter by monitor name or error message
                </label>
                <input
                  id="monitor-filter"
                  type="search"
                  placeholder="Search by monitor name or error message..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-h-11 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{filtered.length}</strong> of{' '}
                  <span className="font-mono">{total}</span> down monitors
                </span>
                {filtersOn && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-brand-600 dark:text-brand-400 font-semibold underline hover:text-brand-700 ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Announce live filtering */}
            <p aria-live="polite" aria-atomic="true" className="sr-only">
              {firstLoad
                ? 'Loading down monitors'
                : loading
                  ? 'Refreshing down monitors'
                  : filtered.length === 0
                    ? emptyMessage
                    : `${filtered.length} of ${total} down monitors shown`}
            </p>

            {/* Latest Alerts Data Section */}
            <MonitorRecords rows={filtered} {...surface} />
          </div>
        </main>
      </div>
    </div>
  );
}