import type { MonitorListProps } from '../lib/types';
import { absoluteTime, relativeTime } from '../lib/time';
import { EmptyState } from './EmptyState';
import { DownMonitorRecord, DownMonitorRecordSkeleton } from './DownMonitorRecord';

/** Placeholders drawn while the first response is in flight. */
const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

/** The console list: one record per down monitor, same fields on every width. */
export function MonitorRecords({
  rows,
  firstLoad,
  filtersOn,
  emptyMessage,
  onClearFilter,
  now,
}: MonitorListProps) {
  if (firstLoad) {
    return (
      <ul className="flex flex-col gap-2">
        {SKELETON_KEYS.map((k) => (
          <DownMonitorRecordSkeleton key={k} />
        ))}
      </ul>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-md bg-white dark:bg-slate-900">
        <EmptyState showClear={filtersOn} onClear={onClearFilter} message={emptyMessage} />
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((m) => (
        <DownMonitorRecord
          key={m.monitor_id}
          monitor={m}
          relativeTime={relativeTime(m.timestamp, now)}
          absoluteLabel={absoluteTime(m.timestamp)}
        />
      ))}
    </ul>
  );
}
