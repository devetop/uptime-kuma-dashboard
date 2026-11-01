import type { DownMonitor, QuickStats } from "@shared/index.ts";
import { DOWN_MONITORS_SQL, QUICK_STATS_SQL } from "./sql.js";
import { mapDownMonitorRows, mapQuickStats, type RawMonitorRow, type RawQuickStatsRow } from "./mappers.js";

/**
 * MySQL/MariaDB bridge. Creates a fresh pool per-request for simplicity.
 * For production workloads, keep the pool alive across requests instead.
 */
export async function fetchData(): Promise<{ monitors: DownMonitor[]; stats: QuickStats }> {
  const mysql = await import("mysql2/promise");
  const host     = process.env.DB_HOST;
  const port     = Number(process.env.DB_PORT ?? 3306);
  const database = process.env.DB_NAME;
  const user     = process.env.DB_USER;
  const password = process.env.DB_PASS;

  if (!host || !database || !user || !password) {
    throw new Error(
      "Missing MySQL/MariaDB env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS",
    );
  }

  const pool = mysql.createPool({
    host,
    port,
    database,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 4,
    connectTimeout: 8000,
    charset: "utf8mb4",
  });

  try {
    const [monitorRows] = await pool.query(DOWN_MONITORS_SQL);
    const [statsRows] = await pool.query(QUICK_STATS_SQL);
    const firstStatsRow = Array.isArray(statsRows) ? (statsRows[0] as RawQuickStatsRow | undefined) : undefined;
    return {
      monitors: mapDownMonitorRows(monitorRows as unknown as RawMonitorRow[]),
      stats: mapQuickStats(firstStatsRow),
    };
  } finally {
    await pool.end();
  }
}

// Alias for backwards compatibility if needed
export const fetchDownMonitors = fetchData;
