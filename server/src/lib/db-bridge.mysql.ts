import type { DownMonitor, QuickStats, SslExpiredItem, DomainExpiredItem } from "@shared/index.ts";
import {
  DOWN_MONITORS_SQL,
  QUICK_STATS_SQL,
  SSL_EXPIRED_MYSQL_SQL,
  ACTIVE_TLS_MONITORED_SQL,
  DOMAIN_EXPIRED_MYSQL_SQL,
  ACTIVE_DOMAINS_MONITORED_SQL,
} from "./sql.js";
import {
  mapDownMonitorRows,
  mapQuickStats,
  mapSslExpiredRows,
  mapActiveTlsMonitored,
  mapDomainExpiredRows,
  mapActiveDomainsMonitored,
  type RawMonitorRow,
  type RawQuickStatsRow,
  type RawSslExpiredRow,
  type RawActiveTlsRow,
  type RawDomainExpiredRow,
  type RawActiveDomainsRow,
} from "./mappers.js";

function getPoolConfig() {
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

  return {
    host,
    port,
    database,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 4,
    connectTimeout: 8000,
    charset: "utf8mb4",
  };
}

/**
 * MySQL/MariaDB bridge. Creates a fresh pool per-request for simplicity.
 * For production workloads, keep the pool alive across requests instead.
 */
export async function fetchData(): Promise<{ monitors: DownMonitor[]; stats: QuickStats }> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool(getPoolConfig());

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

export async function fetchSslExpired(): Promise<{ items: SslExpiredItem[]; activeTlsMonitored: number }> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool(getPoolConfig());

  try {
    const [rows] = await pool.query(SSL_EXPIRED_MYSQL_SQL);
    const [countRows] = await pool.query(ACTIVE_TLS_MONITORED_SQL);
    const firstCountRow = Array.isArray(countRows) ? (countRows[0] as RawActiveTlsRow | undefined) : undefined;
    return {
      items: mapSslExpiredRows(rows as unknown as RawSslExpiredRow[]),
      activeTlsMonitored: mapActiveTlsMonitored(firstCountRow),
    };
  } finally {
    await pool.end();
  }
}

export async function fetchDomainExpired(): Promise<{ items: DomainExpiredItem[]; activeDomainsMonitored: number }> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool(getPoolConfig());

  try {
    const [rows] = await pool.query(DOMAIN_EXPIRED_MYSQL_SQL);
    const [countRows] = await pool.query(ACTIVE_DOMAINS_MONITORED_SQL);
    const firstCountRow = Array.isArray(countRows) ? (countRows[0] as RawActiveDomainsRow | undefined) : undefined;
    return {
      items: mapDomainExpiredRows(rows as unknown as RawDomainExpiredRow[]),
      activeDomainsMonitored: mapActiveDomainsMonitored(firstCountRow),
    };
  } finally {
    await pool.end();
  }
}

// Alias for backwards compatibility if needed
export const fetchDownMonitors = fetchData;