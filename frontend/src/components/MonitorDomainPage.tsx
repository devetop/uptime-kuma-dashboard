import { useMemo, useState } from 'react';
import type { DomainExpiredItem } from '@shared/index.ts';
import { DomainIcon } from './icons';
import { EmptyState } from './EmptyState';
import { PageHeader, InlineError, SearchBar } from './PageChrome';
import { ExpiryKpiGrid, RiskDistribution } from './ExpiryRiskPanel';
import { ExpiryCards, ExpiryTable, type ExpiryRecord, type ExpiryRecordLabels } from './ExpiryRecords';
import { computeExpiryStats, fleetCoverage, formatValidTo } from '../lib/expiry';

const LABELS: ExpiryRecordLabels = {
  headers: ['Domain / Registrar', 'Expiration Date', 'Days Left', 'Notification Status'],
  expiresAt: 'Expiry Date',
  status: 'Last Notification',
  Icon: DomainIcon,
};

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

  const stats = useMemo(
    () => computeExpiryStats(data, activeDomainsMonitored),
    [data, activeDomainsMonitored],
  );

  const records: ExpiryRecord[] = filtered.map((item) => ({
    key: item.domain,
    title: item.domain,
    expiresAt: item.expiry,
    daysLeft: item.days_left,
    status: item.last_deadline_sent ? formatValidTo(item.last_deadline_sent) : 'No notification sent',
  }));

  // Fleet card: coverage is records-in-view over the tracked fleet, never
  // `totalFleet / totalFleet` (which pinned the badge and bar at 100%).
  const coverage = fleetCoverage(data.length, stats.totalFleet);

  return (
    <main
      className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden transition-colors"
      data-purpose="main-dashboard-body"
    >
      <div className="space-y-7">
        <PageHeader
          title="Monitor Domain"
          subtitle="Tracking domain expiry and renewal deadlines across registered domains (expiring within 21 days)"
          loading={loading}
          refreshLabel="Refresh Domain Status"
          onRefresh={onRefresh}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        {error !== null && <InlineError error={error} onRetry={onRefresh} />}

        <ExpiryKpiGrid
          expiredLabel="Expired Domains"
          stats={stats}
          total={total}
          fleet={{
            label: 'Active Domains Monitored',
            badge: coverage.badge,
            badgeClass:
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            barPct: coverage.barPct,
          }}
        />

        <RiskDistribution
          heading="Domain Expiry Distribution"
          subtitle="Aggregated lifecycle exposure across global TLD registries"
          stats={stats}
          tileCaptions={[
            'Redemption grace',
            'Expiring this week',
            'Auto-debit active',
            'Low priority risk',
          ]}
        />

        <SearchBar
          id="domain-filter"
          label="Filter by domain or registrar"
          placeholder="Search domain or registrar..."
          value={filter}
          onChange={setFilter}
          onClear={() => setFilter('')}
          shown={filtered.length}
          total={total}
          suffix="tracked domains"
        />

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
              <ExpiryTable records={records} labels={LABELS} />
              <ExpiryCards records={records} labels={LABELS} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
