import type { MonitorView } from '../lib/types';
import { DownMonitorRow, DownMonitorCard } from './DownMonitorRow';

interface Props {
  monitor: MonitorView;
  relativeTime: string;
  absoluteLabel: string;
}

export function DownMonitorRecord(props: Props) {
  return (
    <>
      <div className="hidden wide:table-row-group">
        <DownMonitorRow {...props} />
      </div>
      <div className="block wide:hidden">
        <DownMonitorCard {...props} />
      </div>
    </>
  );
}

export { DownMonitorRowSkeleton as DownMonitorRecordSkeleton } from './DownMonitorRow';