import type { DownMonitor } from '@shared/index.ts';
import { DOWN_MONITORS_SQL } from './sql.js';
import { mapDownMonitorRows, type RawMonitorRow } from './mappers.js';

/**
 * MySQL/MariaDB bridge. Creates a fresh pool per-request for simplicity.
 * For production workloads, keep the pool alive across requests instead.
 */
export async function fetchDownMonitors(): Promise<DownMonitor[]> {
  const mysql = await import('mysql2/promise');
  const host     = process.env.DB_HOST;
  const port     = Number(process.env.DB_PORT ?? 3306);
  const database = process.env.DB_NAME;
  const user     = process.env.DB_USER;
  const password = process.env.DB_PASS;

  if (!host || !database || !user || !password) {
    throw new Error(
      'Missing MySQL/MariaDB env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS',
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
    charset: 'utf8mb4',
  });

  try {
    // mysql2 returns [rows, fields] — the generic here describes the first element
    const [rows] = await pool.query(DOWN_MONITORS_SQL);
    return mapDownMonitorRows(rows as unknown as RawMonitorRow[]);
  } finally {
    await pool.end();
  }
}
