import type { CountState } from '../lib/types';
import { MoonIcon, RefreshIcon, SunIcon } from './icons';

/* The count is the payload, so it wears a status colour. Both token sets already
   exist in the badge palette (REFUSED red, OTHER slate), so "0 down" never reads
   as an alarm. Text 7.6:1 / 14.0:1 light and 11.1:1 / 9.9:1 dark; borders >= 4.5:1.
   `unknown` = first load failed: claiming "0 down" would read as "all up". */
const COUNT_TONE = {
  alarm: 'border-red-600 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'border-slate-500 bg-slate-50 text-slate-800 dark:border-slate-400 dark:bg-slate-800 dark:text-slate-300',
} as const;

interface Props {
  count: CountState;
  loading: boolean;
  isDark: boolean;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

export function Header({ count, loading, isDark, onRefresh, onToggleTheme }: Props) {
  const tone = count.state === 'count' && count.total > 0 ? COUNT_TONE.alarm : COUNT_TONE.neutral;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 grow">
          <h1 className="text-base leading-6 font-semibold text-slate-900 dark:text-slate-50">
            Down Monitors
          </h1>
          <p className="mt-1">
            {count.state === 'skeleton' ? (
              <>
                <span
                  aria-hidden
                  className="block h-5 w-12 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
                />
                <span className="sr-only">Loading monitor status</span>
              </>
            ) : (
              <span
                className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-xs leading-4 font-semibold tabular-nums ${tone}`}
              >
                {count.state === 'unknown' ? 'Status unknown' : `${count.total} down`}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-2 hidden font-mono text-xs leading-4 tabular-nums text-slate-600 md:block dark:text-slate-400">
            Auto-refresh: 30s
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm leading-5 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
          >
            <RefreshIcon spin={loading} />
            {/* Always "Refresh": the banner below owns the retry affordance, so the
                header never duplicates the same CTA label during a failure. */}
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
