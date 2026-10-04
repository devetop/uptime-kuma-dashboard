import type { DownMonitor } from '@shared/index.ts';
import { classifyError } from '../lib/errors';

/**
 * One source of truth for how a monitor reads. The wide row and the narrow card
 * both call it, so the two views can never drift apart.
 */
function display(monitor: DownMonitor) {
  return {
    type: classifyError(monitor.msg),
    /** ISO instant on <time datetime>. The human label is rendered visibly,
     *  never tooltip-only, so absolute time is reachable by keyboard and AT. */
    iso: new Date(monitor.timestamp * 1000).toISOString(),
    ping: `${monitor.ping > 0 ? monitor.ping.toFixed(2) : '0'} ms`,
    message: monitor.msg ?? 'No error message',
  };
}

interface Props {
  monitor: DownMonitor;
  /** Pre-computed relative label, e.g. "12 minutes ago" */
  relativeTime: string;
  /** Pre-computed absolute label */
  absoluteLabel: string;
}

/** 12px rhythm at <1024px, 8px at >=1024px (both multiples of the 4px scale). */
const CELL = 'px-4 py-3 align-top lg:py-2';

const ROW_SURFACE =
  'odd:bg-white even:bg-slate-50 hover:bg-slate-100 dark:odd:bg-slate-900 dark:even:bg-slate-800/60 dark:hover:bg-slate-800';

const NAME = 'text-sm leading-5 font-semibold text-slate-900 dark:text-slate-50';
const META = 'font-mono text-xs leading-4 tabular-nums text-slate-600 dark:text-slate-400';
/** Numeric styling with no colour, so each call site owns exactly one text colour
 *  (two dark:text-* on one element would be a source-order coin flip). */
const NUM = 'font-mono text-sm leading-5 tabular-nums';
const VALUE = `${NUM} text-slate-800 dark:text-slate-200`;
const DURATION = `${NUM} font-semibold text-slate-900 dark:text-slate-50`;
// Error message: monospace text only. A tinted chip was invisible on the odd
// (white) rows and visible on the even (slate-50) ones, so the boundary lay out
// with the zebra stripes. Plain mono text reads identically on every surface.
const CODE =
  'block break-words font-mono text-xs leading-4 text-slate-700 dark:text-slate-300';
const BADGE_BASE =
  'inline-flex items-center rounded-md border px-2 py-1 text-xs leading-4 font-semibold ';

/** Wide-viewport row (>= 45rem). Focusable so a whole record is keyboard-reachable. */
export function DownMonitorRow({ monitor, relativeTime, absoluteLabel }: Props) {
  const { type, iso, ping, message } = display(monitor);

  return (
    <tr tabIndex={0} className={`border-b border-slate-200 transition-colors last:border-b-0 dark:border-slate-800 ${ROW_SURFACE}`}>
      <th scope="row" className={`${CELL} font-normal`}>
        <span className={`block break-words ${NAME}`}>{monitor.monitor_name}</span>
        <span className={`mt-1 block ${META}`}>ID #{monitor.monitor_id}</span>
      </th>

      <td className={CELL}>
        <span className={`block ${DURATION}`}>{relativeTime}</span>
        <time dateTime={iso} className={`mt-1 block ${META}`}>
          {absoluteLabel}
        </time>
      </td>

      <td className={`${CELL} text-right ${VALUE}`}>{ping}</td>

      <td className={CELL}>
        <code className={`${CODE} max-w-96`}>{message}</code>
      </td>


      <td className={`${CELL} whitespace-nowrap`}>
        <span className={`${BADGE_BASE}${type.badgeClass}`}>{type.label}</span>
      </td>
    </tr>
  );
}

/** Narrow-viewport card (< 45rem). Same fields, explicit labels, stacked. */
export function DownMonitorCard({ monitor, relativeTime, absoluteLabel }: Props) {
  const { type, iso, ping, message } = display(monitor);

  return (
    <li
      tabIndex={0}
      className={`border-b border-slate-200 p-4 transition-colors last:border-b-0 dark:border-slate-800 ${ROW_SURFACE}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 grow text-base leading-6 font-semibold break-words text-slate-900 dark:text-slate-50">
          {monitor.monitor_name}
        </h2>
        <span className={`shrink-0 ${BADGE_BASE}${type.badgeClass}`}>{type.label}</span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <dt className={`font-medium ${META}`}>Down for</dt>
          <dd className={`mt-1 ${DURATION}`}>{relativeTime}</dd>
        </div>
        <div>
          <dt className={`font-medium ${META}`}>Ping</dt>
          <dd className={`mt-1 ${VALUE}`}>{ping}</dd>
        </div>
        <div className="col-span-2">
          <dt className={`font-medium ${META}`}>Last checked</dt>
          <dd>
            <time dateTime={iso} className={`mt-1 block ${VALUE}`}>
              {absoluteLabel}
            </time>
            <span className={`mt-1 block ${META}`}>ID #{monitor.monitor_id}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-2">
        <p className={`font-medium ${META}`}>Error message</p>
        <code className={`mt-1 ${CODE}`}>{message}</code>
      </div>
    </li>
  );
}

const BAR = 'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800';

/** Skeleton matching the real row geometry (two lines per cell, ~56px tall). */
export function DownMonitorRowSkeleton() {
  return (
    <tr
      aria-hidden
      className={`border-b border-slate-200 last:border-b-0 dark:border-slate-800 ${ROW_SURFACE}`}
    >
      <td className={CELL}>
        <span className={`block h-5 w-44 ${BAR}`} />
        <span className={`mt-1 block h-4 w-16 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`block h-5 w-24 ${BAR}`} />
        <span className={`mt-1 block h-4 w-28 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`ml-auto block h-5 w-12 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`block h-4 w-full max-w-96 ${BAR}`} />
        <span className={`mt-2 block h-4 w-2/3 max-w-64 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`block h-6 w-24 ${BAR}`} />
      </td>
    </tr>
  );
}

/** Skeleton matching the real card geometry. */
export function DownMonitorCardSkeleton() {
  return (
    <li
      aria-hidden
      className={`border-b border-slate-200 p-4 last:border-b-0 dark:border-slate-800 ${ROW_SURFACE}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`block h-6 w-48 ${BAR}`} />
        <span className={`block h-6 w-24 ${BAR}`} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className={`block h-5 w-24 ${BAR}`} />
        <span className={`block h-5 w-16 ${BAR}`} />
      </div>
      <span className={`mt-2 block h-4 w-40 ${BAR}`} />
      <span className={`mt-3 block h-4 w-full ${BAR}`} />
      <span className={`mt-2 block h-4 w-2/3 ${BAR}`} />
    </li>
  );
}
