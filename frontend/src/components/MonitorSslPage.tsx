import { useMemo, useState } from 'react';
import type { SslExpiredItem } from '@shared/index.ts';
import { SslIcon } from './icons';
import { EmptyState } from './EmptyState';
import { PageHeader, InlineError, SearchBar } from './PageChrome';
import { ExpiryKpiGrid, RiskDistribution } from './ExpiryRiskPanel';
import { ExpiryCards, ExpiryTable, type ExpiryRecord, type ExpiryRecordLabels } from './ExpiryRecords';
import { computeExpiryStats } from '../lib/expiry';

const LABELS: ExpiryRecordLabels = {
  headers: ['Certificate / Monitor Name', 'Type', 'Valid Until', 'Days Left'],
  expiresAt: 'Valid Until',
  Icon: SslIcon,
};

interface Props {
  data: SslExpiredItem[];
  total: number;
  activeTlsMonitored: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function MonitorSslPage({
  data,
  total,
  activeTlsMonitored,
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
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        String(item.monitor_id).includes(query),
    );
  }, [data, query]);

  const stats = useMemo(
    () => computeExpiryStats(data, activeTlsMonitored),
    [data, activeTlsMonitored],
  );

  const records: ExpiryRecord[] = filtered.map((item) => ({
    key: String(item.monitor_id),
    title: item.name,
    meta: `Monitor ID #${item.monitor_id}`,
    expiresAt: item.valid_to,
    daysLeft: item.days_left,
  }));

  return (
    <main
      className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden transition-colors"
      data-purpose="main-dashboard-body"
    >
      <div className="space-y-7">
        <PageHeader
          title="Monitor SSL"
          subtitle="Tracking SSL/TLS certificate expiry across active monitors (expiring within 21 days)"
          loading={loading}
          refreshLabel="Refresh SSL Status"
          onRefresh={onRefresh}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        {error !== null && <InlineError error={error} onRetry={onRefresh} />}

        <ExpiryKpiGrid
          expiredLabel="Expired Certificates"
          stats={stats}
          total={total}
          // ponytail: badge is an uptime percentage, NOT fleet coverage — do not
          // replace with `fleetCoverage()` (different denominator). Still mock;
          // wire to a real uptime field when the API exposes one.
          fleet={{
            label: 'Active TLS Monitored',
            badge: '98.4% Up',
            badgeClass:
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            barPct: '88%',
          }}
        />

        <RiskDistribution
          heading="Certificate Fleet Risk Distribution"
          subtitle="Breakdown of domain certificates across lifecycle risk windows"
          stats={stats}
          tileCaptions={[
            'Interrupted services',
            'Renew within 1 week',
            'Under auto-check',
            '> 21 days valid',
          ]}
        />

        <SearchBar
          id="ssl-filter"
          label="Filter by certificate name or monitor type"
          placeholder="Search certificate name or type..."
          value={filter}
          onChange={setFilter}
          onClear={() => setFilter('')}
          shown={filtered.length}
          total={total}
          suffix="critical records"
        />

        <section aria-label="SSL Expiry Records" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SSL Expiry Records
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
              Showing {filtered.length} Critical Entities
            </span>
          </div>

          {loading && data.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading SSL expiry records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-6">
              <EmptyState
                showClear={Boolean(query)}
                onClear={() => setFilter('')}
                message={query ? `No certificates match “${query}”.` : 'No certificates expiring within 21 days.'}
              />
            </div>
          ) : (
            <>
              <ExpiryTable records={records} labels={LABELS} />

              {/* Footer strip lives outside the table so it does not repeat per row. */}
              <div className="hidden wide:flex p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>Auto-renewal hooks integrated with Let's Encrypt, Cloudflare &amp; AWS ACM</span>
                <span className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-sm">
                  Automated TLS Audit
                </span>
              </div>

              <ExpiryCards records={records} labels={LABELS} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
