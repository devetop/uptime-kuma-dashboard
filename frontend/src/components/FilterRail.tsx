import type { CountState } from '../lib/types';
import type { ErrorCategory } from '../lib/errors';
import type { CategoryCount } from '../hooks/useFilters';
import {
  UpplyLogoIcon,
  DashboardIcon,
  MonitorsIcon,
  StatusPagesIcon,
  TeamsIcon,
  SettingsIcon,
} from './icons';

interface Props {
  count: CountState;
  cats: CategoryCount[];
  active: Set<ErrorCategory>;
  onToggle: (c: ErrorCategory) => void;
}

export function FilterRail({ count, cats, active, onToggle }: Props) {
  return (
    <aside
      aria-label="Sidebar navigation"
      className="w-full wide:w-[240px] lg:wide:w-[260px] bg-white dark:bg-slate-900 border-b wide:border-b-0 wide:border-r border-slate-100/90 dark:border-slate-800/80 p-5 sm:p-7 flex flex-col justify-between shrink-0"
      data-purpose="sidebar-navigation"
    >
      <div className="space-y-6 wide:space-y-8">
        {/* Logo Container */}
        <div className="flex items-center gap-3 px-1 pt-1" data-purpose="logo-container">
          <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <UpplyLogoIcon className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Upply
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex wide:flex-col gap-1.5 overflow-x-auto no-scrollbar font-medium" data-purpose="navigation-links">
          {/* Active Item: Dashboard */}
          <a
            href="#dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-brand-500 text-white shadow-pill font-semibold transition-all whitespace-nowrap"
          >
            <DashboardIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm">Dashboard</span>
            {count.state === 'count' && count.total > 0 && (
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {count.total}
              </span>
            )}
          </a>

          {/* Monitors */}
          <a
            href="#monitors"
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group whitespace-nowrap"
          >
            <MonitorsIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
            <span className="text-sm">Monitors</span>
          </a>

          {/* Status Pages */}
          <a
            href="#status-pages"
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group whitespace-nowrap"
          >
            <StatusPagesIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
            <span className="text-sm">Status Pages</span>
          </a>

          {/* Teams */}
          <a
            href="#teams"
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group whitespace-nowrap"
          >
            <TeamsIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
            <span className="text-sm">Teams</span>
          </a>

          {/* Settings */}
          <a
            href="#settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group whitespace-nowrap"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition shrink-0" />
            <span className="text-sm">Settings</span>
          </a>
        </nav>

        {/* Error Type Filter Chips */}
        {cats.length > 0 && (
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
        v2.4.0 • Upply Pro
      </div>
    </aside>
  );
}