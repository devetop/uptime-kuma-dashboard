import { useMemo, useState } from 'react';
import type { DomainExpiredItem } from '@shared/index.ts';
import { RefreshIcon, DomainIcon, SunIcon, MoonIcon } from './icons';
import { EmptyState } from './EmptyState';

interface Props {
  data: DomainExpiredItem[];
  total: number;
  activeDomainsMonitored: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatValidTo(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} · ${hours}:${minutes} UTC`;
}

function getUrgencyInfo(daysLeft: number) {
  if (daysLeft < 0) {
    return {
      tier: 'expired' as const,
      label: `${daysLeft} days (Expired)`,
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
      iconContainerClass:
        'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400',
    };
  }
  if (daysLeft <= 7) {
    return {
      tier: 'critical' as const,
      label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (Critical)`,
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      iconContainerClass:
        'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
    };
  }
  return {
    tier: 'upcoming' as const,
    label: `${daysLeft} days (Warning)`,
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    dotClass: 'bg-sky-500',
    iconContainerClass:
      'bg-sky-100 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400',
  };
}

export function MonitorDomainPage({
  data,
  total,
  activeDomainsMonitored,
  loading,
  error,
  onRefresh,
  isDark,
  onToggleTheme,
}: Props) {
  const [filter, setFilter] = useState('');
  const query = filter.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return data;
    return data.filter(
      (item) =>
        item.domain.toLowerCase().includes(query) ||
        (item.last_deadline_sent && item.last_deadline_sent.toLowerCase().includes(query)),
    );
  }, [data, query]);

  // Breakdown statistics
  const stats = useMemo(() => {
    let expiredCount = 0;
    let criticalCount = 0; // <= 7d & >= 0
    let upcomingCount = 0; // <= 21d & > 7d

    for (const item of data) {
      if (item.days_left < 0) {
        expiredCount++;
      } else if (item.days_left <= 7) {
        criticalCount++;
      } else {
        upcomingCount++;
      }
    }

    const totalFleet = activeDomainsMonitored;
    const healthyCount = Math.max(totalFleet - expiredCount - criticalCount - upcomingCount, 0);

    return {
      expiredCount,
      criticalCount,
      upcomingCount,
      healthyCount,
      totalFleet,
    };
  }, [data, activeDomainsMonitored]);

  const fleetDenom = Math.max(stats.totalFleet, 1);
  const expiredPct = ((stats.expiredCount / fleetDenom) * 100).toFixed(1);
  const criticalPct = ((stats.criticalCount / fleetDenom) * 100).toFixed(1);
  const upcomingPct = ((stats.upcomingCount / fleetDenom) * 100).toFixed(1);
  const healthyPct = ((stats.healthyCount / fleetDenom) * 100).toFixed(1);

  return (
    <main
      className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden transition-colors"
      data-purpose="main-dashboard-body"
    >
      <div className="space-y-7">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2" data-purpose="header-section">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
                Monitor Domain
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tracking domain expiry and renewal deadlines across registered domains (expiring within 21 days)
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Refresh Action Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh Domain Status"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Refreshing...' : 'Refresh Domain Status'}</span>
              <RefreshIcon spin={loading} className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={isDark}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition active:scale-95"
            >
              {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {error !== null && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={onRefresh} className="font-semibold underline ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Top KPI Strip (4 Cards Grid) */}
        <section aria-label="Domain statistics overview" data-purpose="kpi-metrics-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 wide:grid-cols-4 gap-4">
            {/* Card 1: Expired Domains */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  Expired Domains
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                  {stats.expiredCount}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 text-[10px] font-bold">
                  Action Req.
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(Math.max((stats.expiredCount / Math.max(total, 1)) * 100, stats.expiredCount > 0 ? 15 : 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Critical Expiry (<= 7d) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  Critical Expiry (≤ 7d)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {stats.criticalCount}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 text-[10px] font-bold">
                  Severe
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(Math.max((stats.criticalCount / Math.max(total, 1)) * 100, stats.criticalCount > 0 ? 25 : 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Upcoming Expiry (<= 21d) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  Upcoming Expiry (≤ 21d)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {stats.upcomingCount}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 text-[10px] font-bold">
                  Pending
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(Math.max((stats.upcomingCount / Math.max(total, 1)) * 100, stats.upcomingCount > 0 ? 40 : 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Card 4: Active Domains Monitored */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  Active Domains Monitored
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {stats.totalFleet}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                  100% Monitored
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Domain Fleet Risk Distribution Section */}
        <section
          aria-label="Domain Expiry Distribution"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Domain Expiry Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregated lifecycle exposure across global TLD registries
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Expired ({stats.expiredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>≤ 7 Days ({stats.criticalCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>≤ 21 Days ({stats.upcomingCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Healthy ({stats.healthyCount})</span>
              </div>
            </div>
          </div>

          {/* Urgency Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex gap-1 p-0.5">
            <div
              className="bg-rose-500 h-full rounded-l-full transition-all"
              style={{ width: `${Math.max(Number(expiredPct), stats.expiredCount > 0 ? 3 : 0)}%` }}
              title={`Expired: ${stats.expiredCount}`}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${Math.max(Number(criticalPct), stats.criticalCount > 0 ? 4 : 0)}%` }}
              title={`Critical: ${stats.criticalCount}`}
            />
            <div
              className="bg-sky-500 h-full transition-all"
              style={{ width: `${Math.max(Number(upcomingPct), stats.upcomingCount > 0 ? 8 : 0)}%` }}
              title={`Upcoming: ${stats.upcomingCount}`}
            />
            <div
              className="bg-emerald-500 h-full rounded-r-full transition-all flex-1"
              title={`Healthy: ${stats.healthyCount}`}
            />
          </div>

          {/* Grid summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Overdue</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{expiredPct}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Redemption grace</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Immediate Action</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{criticalPct}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Expiring this week</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Scheduled Renew</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{upcomingPct}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-debit active</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Secured</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{healthyPct}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Low priority risk</span>
            </div>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="domain-filter" className="sr-only">
              Filter by domain or registrar
            </label>
            <input
              id="domain-filter"
              type="search"
              placeholder="Search domain or registrar..."
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
              <span className="font-mono">{total}</span> tracked domains
            </span>
            {query && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="text-brand-600 dark:text-brand-400 font-semibold underline hover:text-brand-700 ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Domain Expiry Records Section */}
        <section aria-label="Domain Expiry Records" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Domain Expiry Records
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
              Showing {filtered.length} of {total} Tracked Domains
            </span>
          </div>

          {loading && data.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading domain expiry records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-6">
              <EmptyState
                showClear={Boolean(query)}
                onClear={() => setFilter('')}
                message={query ? `No domains match “${query}”.` : 'No domains expiring within 21 days.'}
              />
            </div>
          ) : (
            <>
              {/* Responsive: Table on wide viewports (>= 45rem) */}
              <div className="hidden wide:block border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 text-[11px] bg-slate-50/40 dark:bg-slate-800/20">
                        <th scope="col" className="py-3.5 px-6">Domain / Registrar</th>
                        <th scope="col" className="py-3.5 px-6">Expiration Date</th>
                        <th scope="col" className="py-3.5 px-6">Days Left</th>
                        <th scope="col" className="py-3.5 px-6">Notification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filtered.map((item) => {
                        const urgency = getUrgencyInfo(item.days_left);
                        return (
                          <tr
                            key={item.domain}
                            tabIndex={0}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <td className="py-4 px-6 align-middle">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgency.iconContainerClass}`}>
                                  <DomainIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                    {item.domain}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatValidTo(item.expiry)}
                            </td>
                            <td className="py-4 px-6 align-middle whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${urgency.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotClass}`} />
                                {urgency.label}
                              </span>
                            </td>
                            <td className="py-4 px-6 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {item.last_deadline_sent
                                ? formatValidTo(item.last_deadline_sent)
                                : 'No notification sent'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Responsive: Cards on narrow viewports (< 45rem) */}
              <div className="block wide:hidden space-y-3">
                {filtered.map((item) => {
                  const urgency = getUrgencyInfo(item.days_left);
                  return (
                    <article
                      key={item.domain}
                      tabIndex={0}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgency.iconContainerClass}`}>
                            <DomainIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                              {item.domain}
                            </h4>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${urgency.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotClass}`} />
                          {urgency.label}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Expiry Date:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatValidTo(item.expiry)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Last Notification:</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {item.last_deadline_sent ? formatValidTo(item.last_deadline_sent) : 'None'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}