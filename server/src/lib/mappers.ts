import type { DownMonitor } from '@shared/index.ts';

/** Raw row shape returned by DOWN_MONITORS_SQL */
export interface RawMonitorRow {
  monitor_id: number;
  monitor_name: string | null;
  timestamp: number;
  ping: number | null;
  up: number | null;
  down: number | null;
  msg: string | null;
}

/**
 * Coerce raw DB rows into the typed domain model.
 *
 * Note: `up`/`down` are smallint *counts* in Uptime Kuma's schema
 * (not strictly boolean), so we coerce defensively with `??` defaults.
 */
export function mapDownMonitorRows(rows: readonly RawMonitorRow[]): DownMonitor[] {
  return rows.map((r) => ({
    monitor_id:   Number(r.monitor_id),
    monitor_name: String(r.monitor_name ?? ''),
    timestamp:    Number(r.timestamp),
    ping:         r.ping == null ? 0 : Number(r.ping),
    up:           r.up == null ? 0 : Number(r.up),
    down:         r.down == null ? 0 : Number(r.down),
    msg:          r.msg ?? null,
  }));
}
