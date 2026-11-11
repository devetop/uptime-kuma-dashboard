import { useState } from 'react';
import { useDownMonitors } from './hooks/useDownMonitors';
import { useSslExpired } from './hooks/useSslExpired';
import { useDomainExpired } from './hooks/useDomainExpired';
import { useTheme } from './hooks/useTheme';
import { useTicker } from './hooks/useTicker';
import { useCriticalCount, useDashboardState } from './hooks/useDashboardState';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { FilterRail, type NavTab } from './components/FilterRail';
import { MonitorRecords } from './components/MonitorRecords';
import { MonitorSslPage } from './components/MonitorSslPage';
import { MonitorDomainPage } from './components/MonitorDomainPage';
import { StatsGrid } from './components/StatsGrid';
import { SearchBar } from './components/PageChrome';

/**
 * The three polling hooks expose a common shape; this collapses ~15 destructured
 * names that are re-spread verbatim into the page props.
 */
const pollProps = <T,>(s: { data: T[]; total: number; loading: boolean; error: string | null }) => ({
  data: s.data,
  total: s.total,
  loading: s.loading,
  error: s.error,
});

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  const now = useTicker(1_000);
  const { data, total, stats, loading, error, reload } = useDownMonitors(5_000);
  const ssl = useSslExpired(5_000);
  const domain = useDomainExpired(5_000);
  const { isDark, toggleTheme } = useTheme();

  const dash = useDashboardState(data, total, stats, loading, error, now);
  const sslCriticalCount = useCriticalCount(ssl.data);
  const domainCriticalCount = useCriticalCount(domain.data);

  const refresh = () => {
    void reload();
    void ssl.reload();
    void domain.reload();
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 selection:bg-brand-100 selection:text-brand-700 transition-colors">
      {/* Main Dashboard Frame Container edge-to-edge */}
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 flex flex-col wide:flex-row">
        {/* Left Navigation Sidebar */}
        <FilterRail
          count={dash.count}
          cats={dash.cats}
          active={dash.types.active}
          onToggle={dash.types.toggle}
          activeTab={currentTab}
          onSelectTab={setCurrentTab}
          sslCriticalCount={sslCriticalCount}
          domainCriticalCount={domainCriticalCount}
        />

        {/* View Switching: Dashboard, Monitor SSL, or Monitor Domain */}
        {currentTab === 'ssl' ? (
          <MonitorSslPage
            {...pollProps(ssl)}
            activeTlsMonitored={ssl.activeTlsMonitored}
            onRefresh={refresh}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        ) : currentTab === 'domain' ? (
          <MonitorDomainPage
            {...pollProps(domain)}
            activeDomainsMonitored={domain.activeDomainsMonitored}
            onRefresh={refresh}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        ) : (
          /* Main Dashboard Content Area */
          <main
            className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-x-hidden"
            data-purpose="main-dashboard-body"
          >
            <div className="space-y-7">
              <Header
                slot={dash.slot}
                loading={loading}
                isDark={isDark}
                onRefresh={refresh}
                onToggleTheme={toggleTheme}
              />

              {error !== null && <ErrorBanner error={error} onRetry={refresh} />}

              <StatsGrid
                stats={stats}
                totalMonitors={dash.totalMonitors}
                globalUptime={dash.globalUptime}
              />

              <SearchBar
                id="monitor-filter"
                label="Filter by monitor name or error message"
                placeholder="Search by monitor name or error message..."
                value={dash.filter}
                onChange={dash.setFilter}
                onClear={dash.clearFilters}
                shown={dash.filtered.length}
                total={total}
                suffix="down monitors"
              />

              {/* Announce live filtering */}
              <p aria-live="polite" aria-atomic="true" className="sr-only">
                {dash.firstLoad
                  ? 'Loading down monitors'
                  : loading
                    ? 'Refreshing down monitors'
                    : dash.filtered.length === 0
                      ? dash.surface.emptyMessage
                      : `${dash.filtered.length} of ${total} down monitors shown`}
              </p>

              {/* Latest Alerts Data Section */}
              <MonitorRecords rows={dash.filtered} {...dash.surface} />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
