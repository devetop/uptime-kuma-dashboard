import type { MonitorListProps } from '../lib/types';
import { absoluteTime, relativeTime } from '../lib/time';
import { EmptyState } from './EmptyState';
import {
  DownMonitorCard,
  DownMonitorCardSkeleton,
} from './DownMonitorRow';

/** Placeholders drawn while the first response is in flight. */
const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'] as const;

export function MonitorCards({
  rows,
  firstLoad,
  filtersOn,
  emptyMessage,
  onClearFilter,
  now,
}: MonitorListProps) {
  return (
    <>
      <ul className="wide:hidden">
        {firstLoad
          ? SKELETON_KEYS.map((k) => <DownMonitorCardSkeleton key={k} />)
          : rows.length === 0
            ? null
            : rows.map((m) => (
                <DownMonitorCard
                  key={m.monitor_id}
                  monitor={m}
                  relativeTime={relativeTime(m.timestamp, now)}
                  absoluteLabel={absoluteTime(m.timestamp)}
                />
              ))}
      </ul>

      {!firstLoad && rows.length === 0 && (
        <div className="wide:hidden">
          <EmptyState showClear={filtersOn} onClear={onClearFilter} message={emptyMessage} />
        </div>
      )}
    </>
  );
}
