import type { ReactElement } from 'react';
import type { CountState } from '../lib/types';
import type { ErrorCategory } from '../lib/errors';
import type { CategoryCount } from '../hooks/useFilters';
import {
  UpplyLogoIcon,
  DashboardIcon,
  TeamsIcon,
  SettingsIcon,
} from './navIcons';
import { SslIcon, DomainIcon } from './icons';

export type NavTab = 'dashboard' | 'ssl' | 'domain';

/**
 * Sidebar entries. The three live tabs pair with a count badge; Teams/Settings
 * stay decorative (no `onSelectTab`) per AGENTS.md — no handler, no route.
 */
const NAV_ITEMS: {
  tab: NavTab | null;
  label: string;
  Icon: (p: { className?: string }) => ReactElement;
}[] = [
  { tab: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { tab: 'ssl', label: 'Monitor SSL', Icon: SslIcon },
  { tab: 'domain', label: 'Monitor Domain', Icon: DomainIcon },
  { tab: null, label: 'Teams', Icon: TeamsIcon },
  { tab: null, label: 'Settings', Icon: SettingsIcon },
];

interface Props {
  count: CountState;
  cats: CategoryCount[];
  active: Set<ErrorCategory>;
  onToggle: (c: ErrorCategory) => void;
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  sslCriticalCount?: number;
  domainCriticalCount?: number;
}

export function FilterRail({
  count,
  cats,
  active,
  onToggle,
  activeTab = 'dashboard',
  onSelectTab,
  sslCriticalCount = 0,
  domainCriticalCount = 0,
}: Props) {
  const isDashboard = activeTab === 'dashboard';

  /** Badge count for a live tab: dashboard total, or the critical-subset count. */
  const badgeFor = (tab: NavTab): number => {
    if (tab === 'dashboard') return count.state === 'count' ? count.total : 0;
    return tab === 'ssl' ? sslCriticalCount : domainCriticalCount;
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className="w-full wide:w-[240px] lg:wide:w-[260px] bg-white dark:bg-slate-900 border-b wide:border-b-0 wide:border-r border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col justify-between shrink-0"
      data-purpose="sidebar-navigation"
    >
      <div className="space-y-6 wide:space-y-8">
        {/* Logo Container */}
        <div className="flex items-center gap-3 px-1 pt-1" data-purpose="logo-container">
          <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <UpplyLogoIcon className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Down Monitors
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex wide:flex-col gap-1.5 overflow-x-auto no-scrollbar font-medium" data-purpose="navigation-links">
          {NAV_ITEMS.map(({ tab, label, Icon }) => {
            const badge = tab ? badgeFor(tab) : 0;

            // Decorative entries (tab === null) render inert: no click handler.
            if (tab === null) {
              return (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
                  <span className="text-sm">{label}</span>
                </a>
              );
            }

            const selected = activeTab === tab;
            return (
              <a
                key={label}
                href={`#${tab}`}
                onClick={(e) => {
                  if (onSelectTab) {
                    e.preventDefault();
                    onSelectTab(tab);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                  selected
                    ? 'bg-brand-500 text-white shadow-pill'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 group'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition'}`} />
                <span className="text-sm">{label}</span>
                {badge > 0 && (
                  <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${selected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'}`}>
                    {badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Error Type Filter Chips (only active in dashboard view) */}
        {isDashboard && cats.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-2">
              Filter by Error
            </h2>
            <div
              role="group"
              aria-label="Filter by error type"
              className="flex wide:flex-col gap-1.5 overflow-x-auto no-scrollbar"
            >
              {cats.map((c) => {
                const on = active.has(c.category);
                return (
                  <button
                    key={c.category}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(c.category)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      on
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 ring-1 ring-brand-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span aria-hidden className={`size-2 shrink-0 rounded-full ${c.dotClass}`} />
                    <span className="truncate max-w-[130px]">{c.label}</span>
                    <span className="ml-auto font-mono text-[11px] tabular-nums opacity-70">
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="hidden wide:block pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
        v2.4.0 • Down Monitors
      </div>
    </aside>
  );
}