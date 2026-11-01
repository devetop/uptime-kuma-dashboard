import type { DownMonitor, QuickStats } from "@shared/index.ts";

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

/** Raw row shape returned by QUICK_STATS_SQL */
export interface RawQuickStatsRow {
  up?: number | string | null;
  down?: number | string | null;
  pending?: number | string | null;
  maintenance?: number | string | null;
  unknown?: number | string | null;
  pause?: number | string | null;
  active?: number | string | null;
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
    monitor_name: String(r.monitor_name ?? ""),
    timestamp:    Number(r.timestamp),
    ping:         r.ping == null ? 0 : Number(r.ping),
    up:           r.up == null ? 0 : Number(r.up),
    down:         r.down == null ? 0 : Number(r.down),
    msg:          r.msg ?? null,
  }));
}

/**
 * Coerce raw quick stats row into the QuickStats domain model.
 * Coerces each column to Number with a fallback of 0.
 */
export function mapQuickStats(row: RawQuickStatsRow | null | undefined): QuickStats {
  return {
    up:          row?.up == null ? 0 : Number(row.up) || 0,
    down:        row?.down == null ? 0 : Number(row.down) || 0,
    pending:     row?.pending == null ? 0 : Number(row.pending) || 0,
    maintenance: row?.maintenance == null ? 0 : Number(row.maintenance) || 0,
    unknown:     row?.unknown == null ? 0 : Number(row.unknown) || 0,
    pause:       row?.pause == null ? 0 : Number(row.pause) || 0,
    active:      row?.active == null ? 0 : Number(row.active) || 0,
  };
}
