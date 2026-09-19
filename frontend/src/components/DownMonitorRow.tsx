import type { DownMonitor } from '@shared/index.ts';
import { classifyError } from '../lib/errors';

interface Props {
  monitor: DownMonitor;
  /** Pre-computed relative label, e.g. "12 minutes ago" */
  relativeTime: string;
  /** Pre-computed absolute label for the tooltip */
  absoluteTime: string;
}

export function DownMonitorRow({ monitor, relativeTime, absoluteTime }: Props) {
  const errorInfo = classifyError(monitor.msg);

  return (
    <tr className="border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 align-top">
        <div className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-snug break-words">
          {monitor.monitor_name}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          #{monitor.monitor_id}
        </div>
      </td>

      <td className="px-3 py-2.5 sm:px-4 sm:py-3 align-top whitespace-nowrap">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {relativeTime}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500" title={absoluteTime}>
          {absoluteTime}
        </div>
      </td>

      <td className="px-3 py-2.5 sm:px-4 sm:py-3 align-top whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
        {monitor.ping > 0 ? `${monitor.ping.toFixed(2)} ms` : '0 ms'}
      </td>

      <td className="px-3 py-2.5 sm:px-4 sm:py-3 align-top">
        <code className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded px-1.5 py-0.5 break-words">
          {monitor.msg ?? '—'}
        </code>
      </td>

      <td className="px-3 py-2.5 sm:px-4 sm:py-3 align-top whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${errorInfo.badgeClass}`}
        >
          {errorInfo.label}
        </span>
      </td>
    </tr>
  );
}
