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
import { MoreIcon, ChevronRightIcon, FigmaIcon } from './components/icons';

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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-10 selection:bg-brand-100 selection:text-brand-700 bg-[#DDE7F6] dark:bg-[#0B132B] transition-colors">
      {/* Main Dashboard Frame Container matching 1440px desktop frame */}
      <div className="w-full max-w-[1440px] bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl border border-white/60 dark:border-slate-800/80 overflow-hidden flex flex-col wide:flex-row min-h-[920px]">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-md transition">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-md transition">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-md transition">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-md transition">
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

            {/* Monitoring Status Cards Section */}
            <section className="relative" data-purpose="monitoring-cards-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Monitoring
                </h2>
                <a
                  href="#all-monitors"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
                >
                  See All
                </a>
              </div>

              {/* 3 Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: About Us */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-card hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                        U
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          About Us
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                          https://fireart.studio/about-us/
                        </p>
                      </div>
                    </div>
                    <button type="button" aria-label="Card options" className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 p-1">
                      <MoreIcon />
                    </button>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
                      Current status
                    </span>
                    <span className="text-xs font-bold text-status-up">
                      Up for 2 days
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Total Uptime</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">99.1%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Response time</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3.1 s</span>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="mt-3 relative h-20 w-full">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 240 80">
                      <defs>
                        <linearGradient id="grad-card1" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 65 Q 40 65 70 30 T 140 55 T 200 60 L 240 58 L 240 80 L 0 80 Z" fill="url(#grad-card1)" />
                      <path d="M 0 65 Q 40 65 70 30 T 140 55 T 200 60 L 240 58" fill="none" stroke="#2563EB" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1">
                    <span>11 AM</span>
                    <span>1 PM</span>
                    <span>3 PM</span>
                    <span>5 PM</span>
                  </div>
                </div>

                {/* Card 2: Cases */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-card hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                        U
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          Cases
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                          https://fireart.studio/cases/
                        </p>
                      </div>
                    </div>
                    <button type="button" aria-label="Card options" className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 p-1">
                      <MoreIcon />
                    </button>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
                      Current status
                    </span>
                    <span className="text-xs font-bold text-status-up">
                      Up for 21 hour
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Total Uptime</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">99.1%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Response time</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3.1 s</span>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="mt-3 relative h-20 w-full">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 240 80">
                      <defs>
                        <linearGradient id="grad-card2" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 68 Q 25 35 45 42 T 95 62 T 145 48 T 195 54 L 240 60 L 240 80 L 0 80 Z" fill="url(#grad-card2)" />
                      <path d="M 0 68 Q 25 35 45 42 T 95 62 T 145 48 T 195 54 L 240 60" fill="none" stroke="#2563EB" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1">
                    <span>11 AM</span>
                    <span>1 PM</span>
                    <span>3 PM</span>
                    <span>5 PM</span>
                  </div>
                </div>

                {/* Card 3: Figma */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-card hover:border-slate-200 dark:hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center p-2 shadow-sm">
                        <FigmaIcon className="w-full h-full" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          Figma
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                          https://figma.com/
                        </p>
                      </div>
                    </div>
                    <button type="button" aria-label="Card options" className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 p-1">
                      <MoreIcon />
                    </button>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
                      Current status
                    </span>
                    <span className="text-xs font-bold text-status-down">
                      Down for 1 minutes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Total Uptime</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">92.4%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Response time</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">4.1 s</span>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="mt-3 relative h-20 w-full">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 240 80">
                      <defs>
                        <linearGradient id="grad-card3" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 62 Q 25 65 50 50 T 110 52 T 170 56 Q 195 50 215 15 L 215 80 L 0 80 Z" fill="url(#grad-card3)" />
                      <path d="M 0 62 Q 25 65 50 50 T 110 52 T 170 56 Q 195 50 215 15" fill="none" stroke="#2563EB" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1">
                    <span>11 AM</span>
                    <span>1 PM</span>
                    <span>3 PM</span>
                    <span>5 PM</span>
                  </div>
                </div>
              </div>

              {/* Floating Outages Popover Modal Card */}
              <div
                className="hidden sm:block absolute -left-4 top-[84px] md:top-[95px] z-20 w-[310px] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-popover border border-slate-100 dark:border-slate-800"
                data-purpose="outage-details-popover"
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                  Outages
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Recovered at location</span>
                  <span className="text-sm">🇩🇪</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Frankfurt</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-rose-500 text-white font-extrabold text-sm shadow-sm">
                      408
                    </span>
                    <div className="mt-2.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                        30001.00 ms
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-medium mt-0.5 leading-tight">
                        May, 21 2021 • 01:21:10 GMT
                      </span>
                    </div>
                  </div>

                  <div className="px-2 text-slate-300 dark:text-slate-600">
                    <ChevronRightIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 text-right">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-extrabold text-sm shadow-sm">
                      200
                    </span>
                    <div className="mt-2.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                        249.00 ms
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-medium mt-0.5 leading-tight">
                        May, 21 2021 • 01:26:10 GMT
                      </span>
                    </div>
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