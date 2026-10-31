import type { MonitorListProps } from '../lib/types';
import { absoluteTime, relativeTime } from '../lib/time';
import { EmptyState } from './EmptyState';
import {
  DownMonitorRow,
  DownMonitorCard,
  DownMonitorRowSkeleton,
  DownMonitorCardSkeleton,
} from './DownMonitorRow';

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4'] as const;

export function MonitorRecords({
  rows,
  firstLoad,
  filtersOn,
  emptyMessage,
  onClearFilter,
  now,
}: MonitorListProps) {
  return (
    <section aria-label="Latest incident alerts table" data-purpose="latest-alerts-table" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Latest Alerts
        </h2>
        <a
          href="#alerts"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
        >
          See All
        </a>
      </div>

      {firstLoad ? (
        <>
          <div className="hidden wide:block border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-card bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 text-[11px] bg-slate-50/40 dark:bg-slate-800/20">
                    <th className="py-3.5 px-6">Check</th>
                    <th className="py-3.5 px-6">Time</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Notified</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SKELETON_KEYS.map((k) => (
                    <DownMonitorRowSkeleton key={k} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="block wide:hidden space-y-3">
            {SKELETON_KEYS.map((k) => (
              <DownMonitorCardSkeleton key={k} />
            ))}
          </div>
        </>
      ) : rows.length === 0 ? (
        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-card bg-white dark:bg-slate-900 p-6">
          <EmptyState showClear={filtersOn} onClear={onClearFilter} message={emptyMessage} />
        </div>
      ) : (
        <>
          <div className="hidden wide:block border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-card bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 text-[11px] bg-slate-50/40 dark:bg-slate-800/20">
                    <th scope="col" className="py-3.5 px-6">Check</th>
                    <th scope="col" className="py-3.5 px-6">Time</th>
                    <th scope="col" className="py-3.5 px-6">Duration</th>
                    <th scope="col" className="py-3.5 px-6">Notified</th>
                    <th scope="col" className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((m) => (
                    <DownMonitorRow
                      key={m.monitor_id}
                      monitor={m}
                      relativeTime={relativeTime(m.timestamp, now)}
                      absoluteLabel={absoluteTime(m.timestamp)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block wide:hidden space-y-3">
            {rows.map((m) => (
              <DownMonitorCard
                key={m.monitor_id}
                monitor={m}
                relativeTime={relativeTime(m.timestamp, now)}
                absoluteLabel={absoluteTime(m.timestamp)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}