import type { MonitorView } from '../lib/types';
import { classifyError } from '../lib/errors';
import { FigmaIcon, DribbbleIcon } from './icons';

function display(monitor: MonitorView) {
  return {
    type: classifyError(monitor.msg),
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

const CELL = 'py-4 px-6 align-middle';
const ROW_SURFACE =
  'hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group';

function ServiceAvatar({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('figma')) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
        <FigmaIcon className="w-full h-full" />
      </div>
    );
  }
  if (lower.includes('dribbble')) {
    return (
      <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 dark:bg-rose-950/60 dark:border-rose-900/60 flex items-center justify-center p-1.5 shrink-0 text-rose-500 shadow-sm">
        <DribbbleIcon className="w-4 h-4 fill-rose-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 dark:bg-brand-950/60 dark:border-brand-900/60 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0 shadow-sm">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

/**
 * Wide-viewport row (>= 45rem) matching "Latest Alerts" table in redesign.png:
 * Columns: Check (Service Avatar + Name + URL), Time, Duration, Message, Error (Badge)
 */
export function DownMonitorRow({ monitor, relativeTime, absoluteLabel }: Props) {
  const { type, iso, ping, message } = display(monitor);

  return (
    <tr
      tabIndex={0}
      className={`border-b border-slate-100 dark:border-slate-800/80 text-xs font-medium last:border-b-0 ${ROW_SURFACE}`}
    >
      {/* Check column: Icon + Service Name + URL */}
      <td className={CELL}>
        <div className="flex items-start gap-3">
          <ServiceAvatar name={monitor.monitor_name} />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white leading-snug break-words">
              {monitor.monitor_name}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
              ID #{monitor.monitor_id} · {ping}
            </p>
          </div>
        </div>
      </td>

      {/* Time column */}
      <td className={`${CELL} text-slate-600 dark:text-slate-300 whitespace-nowrap`}>
        <time dateTime={iso}>{absoluteLabel}</time>
      </td>

      {/* Duration column */}
      <td className={`${CELL} text-slate-700 dark:text-slate-200 whitespace-nowrap font-semibold`}>
        Ongoing for {relativeTime.replace(' ago', '')}
      </td>

      {/* Message column */}
      <td className={`${CELL} text-slate-500 dark:text-slate-400 whitespace-nowrap`}>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] mt-0.5 font-mono">
          {message}
        </p>
      </td>

      {/* Error column */}
      <td className={`${CELL} text-right whitespace-nowrap`}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${type.badgeClass}`}>
          {type.label}
        </span>
      </td>
    </tr>
  );
}

/** Narrow-viewport card (< 45rem) matching mobile Stitch screen card layout */
export function DownMonitorCard({ monitor, relativeTime, absoluteLabel }: Props) {
  const { type, iso, message } = display(monitor);

  return (
    <article
      tabIndex={0}
      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <ServiceAvatar name={monitor.monitor_name} />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              {monitor.monitor_name}
            </h4>
            <p className="text-[10px] text-slate-400">
              <time dateTime={iso}>{absoluteLabel}</time>
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${type.badgeClass}`}>
          {relativeTime.replace(' ago', '')}
        </span>
      </div>

      <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 break-words bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
        {message}
      </p>
    </article>
  );
}

const BAR = 'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800';

/** Skeleton matching table row geometry */
export function DownMonitorRowSkeleton() {
  return (
    <tr aria-hidden className="border-b border-slate-100 dark:border-slate-800/80">
      <td className={CELL}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${BAR}`} />
          <div className="space-y-1">
            <span className={`block h-3.5 w-32 ${BAR}`} />
            <span className={`block h-2.5 w-20 ${BAR}`} />
          </div>
        </div>
      </td>
      <td className={CELL}>
        <span className={`block h-3.5 w-28 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`block h-3.5 w-24 ${BAR}`} />
      </td>
      <td className={CELL}>
        <span className={`block h-3.5 w-40 ${BAR}`} />
      </td>
      <td className={`${CELL} text-right`}>
        <span className={`ml-auto block h-4 w-16 ${BAR}`} />
      </td>
    </tr>
  );
}

/** Skeleton matching card geometry */
export function DownMonitorCardSkeleton() {
  return (
    <article aria-hidden className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${BAR}`} />
          <div className="space-y-1">
            <span className={`block h-3.5 w-28 ${BAR}`} />
            <span className={`block h-2.5 w-20 ${BAR}`} />
          </div>
        </div>
        <span className={`block h-4 w-12 rounded-full ${BAR}`} />
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className={`block h-3 w-32 ${BAR}`} />
      </div>
    </article>
  );
}