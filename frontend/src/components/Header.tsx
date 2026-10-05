import type { LiveSlot } from '../lib/types';
import { LiveState } from './LiveState';
import { MoonIcon, RefreshIcon, SunIcon } from './icons';

interface Props {
  slot: LiveSlot;
  loading: boolean;
  isDark: boolean;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

/**
 * Ops-console toolbar: title + live line, actions pinned right. The count badge
 * moved into the rail's big number (that is where Direction B put the payload),
 * so the header stays one line at every width.
 */
export function Header({ slot, loading, isDark, onRefresh, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
        <h1 className="text-sm leading-5 font-semibold text-slate-900 dark:text-slate-50">
          Down Monitors
        </h1>
        <span className="min-w-0 grow font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400">
          <LiveState slot={slot} /> · auto-refresh 5s
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs leading-4 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
          >
            <RefreshIcon spin={loading} />
            {/* Always "Refresh": the banner owns the retry affordance during a failure. */}
            Refresh
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={isDark}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="inline-flex size-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
