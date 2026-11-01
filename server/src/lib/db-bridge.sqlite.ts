import "node:sqlite";
import { DatabaseSync } from "node:sqlite";
import type { DownMonitor, QuickStats } from "@shared/index.ts";
import { DOWN_MONITORS_SQL, QUICK_STATS_SQL } from "./sql.js";
import { mapDownMonitorRows, mapQuickStats, type RawMonitorRow, type RawQuickStatsRow } from "./mappers.js";

let dbHandle: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbHandle !== null) return dbHandle;

  const path = process.env.DB_PATH;
  if (!path) throw new Error("DB_PATH not set — required when DB_TYPE=sqlite");

  dbHandle = new DatabaseSync(path, { readOnly: true });
  // Validate schema exists before returning the handle
  dbHandle.prepare("SELECT 1 FROM stat_minutely LIMIT 0").get();
  return dbHandle;
}

/**
 * SQLite bridge — reuses the same DB handle across requests.
 * Native node:sqlite is included with Node 22+, no extra dependency needed.
 */
export function fetchData(): { monitors: DownMonitor[]; stats: QuickStats } {
  const client = getDb();
  const monitorRows = client.prepare(DOWN_MONITORS_SQL).all() as unknown as RawMonitorRow[];
  const statsRow = client.prepare(QUICK_STATS_SQL).get() as unknown as RawQuickStatsRow | undefined;
  return {
    monitors: mapDownMonitorRows(monitorRows),
    stats: mapQuickStats(statsRow),
  };
}

// Alias for backwards compatibility if needed
export const fetchDownMonitors = fetchData;