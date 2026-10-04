import type { DownMonitor } from '@shared/index.ts';

/** Branded monitor ID: not interchangeable with timestamps, totals or array indices. */
declare const monitorIdBrand: unique symbol;
export type MonitorId = DownMonitor['monitor_id'] & { readonly [monitorIdBrand]: never };

/**
 * Snapshot of the polling state, discriminated on `loading`. Faithful to the
 * flags the old hook returned: `loading` is true only until the first response
 * settles (a reload never re-arms it), `error` is cleared at the start of every
 * attempt, and `data`/`total` survive a failure so the dashboard never blanks.
 */
interface Snapshot<T> {
  loading: boolean;
  /** Monitors from the last successful response ([] before the first one). */
  data: T[];
  /** Count reported by the last successful response. */
  total: number;
}

export type Result<T> =
  | (Snapshot<T> & { state: 'loading'; error: null })
  | (Snapshot<T> & { state: 'loaded'; error: string | null });

/** Shape of the row/card props. `Pick` keeps it structurally identical to the old inline `Props`. */
export type MonitorView = Omit<DownMonitor, 'monitor_id'> & { monitor_id: MonitorId };

/** Shared fields of the two data surfaces (narrow cards, wide table). */
export interface MonitorSurfaceProps {
  firstLoad: boolean;
  query: string;
  emptyMessage: string;
  onClearFilter: () => void;
  /** 1s clock, passed down so labels never drift between rows. */
  now: number;
}

export type MonitorListProps = MonitorSurfaceProps & { rows: MonitorView[] };

/** The last-updated slot as a state machine instead of a boolean-flag soup. */
export type LiveSlot =
  | { state: 'loading' }
  | { state: 'refreshing' }
  | { state: 'no-data' }
  | { state: 'updated'; at: number };

/** The header count badge as a state machine instead of a `total` + `unknown` pair. */
export type CountState =
  | { state: 'skeleton' }
  | { state: 'unknown' }
  | { state: 'count'; total: number };
