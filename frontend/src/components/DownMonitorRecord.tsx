import type { MonitorView } from '../lib/types';
import { classifyError } from '../lib/errors';

/**
 * Field formatting mirrors DownMonitorRow's `display()`; the two surfaces stay
 * separate files until the old table/card surfaces are retired, then merge.
 * `ponytail:` duplication is deliberate — deleting DownMonitorRow deletes this.
 */
function display(monitor: MonitorView) {
  return {
    type: classifyError(monitor.msg),
    /** ISO instant on <time datetime>; the human label renders visibly, never tooltip-only. */
    iso: new Date(monitor.timestamp * 1000).toISOString(),
    ping: `${monitor.ping > 0 ? monitor.ping.toFixed(2) : '0'} ms`,
    message: monitor.msg ?? 'No error message',
  };
}

interface Props {
  monitor: MonitorView;
  relativeTime: string;
  absoluteLabel: string;
}

/* Card surface, not a table row: one subtle border, no zebra, one shadow owned
   by the list container in App. Same grid at every width — the mockup keeps the
   time column fixed and lets name + message break, and the verifier signed off
   on that geometry. */
const SURFACE =
  'grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60';

/**
 * One record: [down-for | monitor | type]. Duration wears the speech-form
 * relative label as the headline with the absolute instant as text underneath.
 */
export function DownMonitorRecord({ monitor, relativeTime, absoluteLabel }: Props) {
  const { type, iso, ping, message } = display(monitor);

  return (
    <li tabIndex={0} className={SURFACE}>
      <span className="min-w-0">
        <span className="block break-words font-mono text-sm leading-5 font-semibold tabular-nums text-slate-900 dark:text-slate-50">
          {relativeTime}
        </span>
        <time
          dateTime={iso}
          className="mt-1 block break-words font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400"
        >
          {absoluteLabel}
        </time>
      </span>

      <span className="min-w-0">
        <span className="block break-words text-sm leading-5 font-semibold text-slate-900 dark:text-slate-50">
          {monitor.monitor_name}
        </span>
        <code className="mt-1 block break-words font-mono text-xs leading-4 text-slate-700 dark:text-slate-300">
          {message}
        </code>
      </span>

      <span className="flex flex-col items-end gap-1">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs leading-4 font-semibold ${type.badgeClass}`}
        >
          {type.label}
        </span>
        <span className="whitespace-nowrap font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400">
          {ping} · ID #{monitor.monitor_id}
        </span>
      </span>
    </li>
  );
}

const BAR = 'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800';

/** Skeleton matching the record geometry; the live region carries the announcement. */
export function DownMonitorRecordSkeleton() {
  return (
    <li aria-hidden className={SURFACE}>
      <span className={`block h-9 w-24 ${BAR}`} />
      <span className="flex flex-col gap-1">
        <span className={`block h-5 w-40 ${BAR}`} />
        <span className={`block h-4 w-2/3 ${BAR}`} />
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={`block h-6 w-20 ${BAR}`} />
        <span className={`block h-4 w-24 ${BAR}`} />
      </span>
    </li>
  );
}
