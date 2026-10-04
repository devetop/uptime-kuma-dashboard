import type { MonitorListProps } from '../lib/types';
import { absoluteTime, relativeTime } from '../lib/time';
import { EmptyState } from './EmptyState';
import { DownMonitorRow, DownMonitorRowSkeleton } from './DownMonitorRow';

/** Placeholders drawn while the first response is in flight. */
const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

/** Wide-viewport data surface (>= 45rem). */
export function MonitorTable({
  rows,
  firstLoad,
  filtersOn,
  emptyMessage,
  onClearFilter,
  now,
}: MonitorListProps) {
  return (
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
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState showClear={filtersOn} onClear={onClearFilter} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((m) => (
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
  );
}
