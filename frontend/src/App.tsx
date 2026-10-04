import { useState, useEffect, useMemo, useCallback } from 'react';
import type { DownMonitor } from '@shared/index.ts';
import { useDownMonitors } from './hooks/useDownMonitors';
import {
  DownMonitorRow,
  DownMonitorCard,
  DownMonitorRowSkeleton,
  DownMonitorCardSkeleton,
} from './components/DownMonitorRow';
import { relativeTime, absoluteTime } from './lib/time';

/** Placeholders drawn while the first response is in flight. */
const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

export function App() {
  const [now, setNow] = useState(() => Date.now());
  const { data, total, loading, error, reload } = useDownMonitors(30_000);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Update relative timestamps each second without re-fetching
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Follow system theme until the user manually picks one
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  const [filter, setFilter] = useState('');
  const query = filter.trim();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.monitor_name.toLowerCase().includes(q) || (m.msg ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

  const firstLoad = loading && data.length === 0;

  /* The count is the payload, so it wears a status colour. Both token sets already
     exist in the badge palette (REFUSED red, OTHER slate), so "0 down" never reads
     as an alarm. Text 7.6:1 / 14.0:1 light and 11.1:1 / 9.9:1 dark; borders >= 4.5:1.
     `unknown` = first load failed: claiming "0 down" would read as "all up". */
  const unknown = Boolean(error) && data.length === 0;
  const COUNT_BADGE =
    total > 0 && !unknown
      ? 'border-red-600 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300'
      : 'border-slate-500 bg-slate-50 text-slate-800 dark:border-slate-400 dark:bg-slate-800 dark:text-slate-300';

  /** Wall-clock of the last successful response. Polling replaces `data`, so this
   *  tracks real refreshes instead of the 1s tick used for relative labels. */
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    setUpdatedAt(Date.now());
  }, [data]);

  /** One empty message, used by both the card list and the table. */
  const emptyMessage = query
    ? `No down monitors match “${query}”.`
    : unknown
      ? 'No monitor data available.'
      : 'All monitors are up.';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="min-w-0 grow">
            <h1 className="text-base leading-6 font-semibold text-slate-900 dark:text-slate-50">
              Down Monitors
            </h1>
            <p className="mt-1">
              {firstLoad ? (
                <>
                  <span
                    aria-hidden
                    className="block h-5 w-12 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
                  />
                  <span className="sr-only">Loading monitor status</span>
                </>
              ) : (
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-xs leading-4 font-semibold tabular-nums ${COUNT_BADGE}`}
                >
                  {unknown ? 'Status unknown' : `${total} down`}
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
              onClick={() => void reload()}
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
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="inline-flex size-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-red-500 bg-red-50 px-3 py-3 text-sm leading-5 text-red-800 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300"
          >
            <WarnIcon />
            <span className="font-semibold">Could not load monitors</span>
            <span className="min-w-0 grow break-words">{error}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-red-600 px-3 text-xs leading-4 font-semibold text-red-800 transition-colors hover:bg-red-100 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              <RefreshIcon />
              Retry now
            </button>
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="monitor-filter"
            className="mb-1 block text-sm leading-5 font-medium text-slate-700 dark:text-slate-300"
          >
            Filter by monitor name or error message
          </label>
          <input
            id="monitor-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm leading-5 text-slate-900 transition-colors focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-blue-400"
          />
        </div>

        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm leading-5 text-slate-700 dark:text-slate-300">
          <span>
            Showing <span className="font-mono font-semibold tabular-nums">{filtered.length}</span>{' '}
            of <span className="font-mono tabular-nums">{total}</span> down
          </span>
          <span className="font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400">
            <LiveState firstLoad={firstLoad} loading={loading} updatedAt={updatedAt} />
          </span>
        </div>

        {/* One live region so state is announced once, not per surface. */}
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {firstLoad
            ? 'Loading down monitors'
            : loading
              ? 'Refreshing down monitors'
              : filtered.length === 0
                ? `${emptyMessage}`
                : `${filtered.length} of ${total} down monitors shown`}
        </p>

        {/* Data surface: cards below 45rem, table at >= 45rem. No horizontal scroll. */}
        <section
          aria-label="Down monitors"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <ul className="wide:hidden">
            {firstLoad
              ? SKELETON_KEYS.map((k) => <DownMonitorCardSkeleton key={k} />)
              : filtered.length === 0
                ? null
                : filtered.map((m: DownMonitor) => (
                    <DownMonitorCard
                      key={m.monitor_id}
                      monitor={m}
                      relativeTime={relativeTime(m.timestamp, now)}
                      absoluteLabel={absoluteTime(m.timestamp)}
                    />
                  ))}
          </ul>

          {!firstLoad && filtered.length === 0 && (
            <div className="wide:hidden">
              <EmptyState query={query} onClear={() => setFilter('')} message={emptyMessage} />
            </div>
          )}

          <div className="hidden wide:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Monitors currently down, with last-down time, ping, error message and error type.
              </caption>
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[36%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <tr className="text-xs leading-4 font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                  <th scope="col" className="px-4 py-2">
                    Monitor
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Last down
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Ping
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Error message
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {firstLoad ? (
                  SKELETON_KEYS.map((k) => <DownMonitorRowSkeleton key={k} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState query={query} onClear={() => setFilter('')} message={emptyMessage} />
                    </td>
                  </tr>
                ) : (
                  filtered.map((m: DownMonitor) => (
                    <DownMonitorRow
                      key={m.monitor_id}
                      monitor={m}
                      relativeTime={relativeTime(m.timestamp, now)}
                      absoluteLabel={absoluteTime(m.timestamp)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/** Stable text for the last-updated slot. Keyed on data, never on the 1s clock. */
function LiveState({
  firstLoad,
  loading,
  updatedAt,
}: {
  firstLoad: boolean;
  loading: boolean;
  updatedAt: number | null;
}) {
  if (firstLoad) return 'Loading';
  if (loading) return 'Refreshing';
  /* A failed first load never sets updatedAt, so it must not claim "Updated". */
  if (updatedAt === null) return 'No data received';
  return `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function EmptyState({
  query,
  onClear,
  message,
}: {
  query: string;
  onClear: () => void;
  message: string;
}) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 py-8 text-center text-sm leading-5 text-slate-700 dark:text-slate-300">
      {query ? (
        <>
          <span>{message}</span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
          >
            Clear filter
          </button>
        </>
      ) : (
        <span>{message}</span>
      )}
    </p>
  );
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={spin ? 'animate-spin' : undefined}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
