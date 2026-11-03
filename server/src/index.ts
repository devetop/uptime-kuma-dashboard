/**
 * Read-only API server (Express 5 + TypeScript) for the down-monitors dashboard.
 *
 * DB modes (from environment variables only):
 *   DB_TYPE=sqlite           DB_PATH=/abs/path/kuma.db
 *   DB_TYPE=mysql|mariadb    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 *
 * Run from the project root:  npm run dev:server
 */
import process from 'node:process';
import { createApp } from './lib/app.js';

const REQUIRED: Record<'sqlite' | 'remote', readonly string[]> = {
  sqlite: ['DB_PATH'],
  remote: ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS'],
};

function resolveDbType(): 'sqlite' | 'remote' {
  const raw = (process.env.DB_TYPE ?? '').trim().toLowerCase();
  if (raw === 'sqlite') return 'sqlite';
  if (raw === 'mysql' || raw === 'mariadb') return 'remote';
  throw new Error(
    `Unsupported DB_TYPE "${raw}". Set DB_TYPE to sqlite, mysql or mariadb.`,
  );
}

function assertConfig(kind: 'sqlite' | 'remote'): void {
  const missing = REQUIRED[kind].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    const label = kind === 'sqlite' ? 'SQLite (DB_PATH)' : 'MySQL/MariaDB (DB_*)';
    throw new Error(
      `Missing ${label} env var(s): ${missing.join(', ')}. ` +
        'See server/.env.example for supported formats.',
    );
  }
}

async function main(): Promise<void> {
  const dbType = resolveDbType();
  assertConfig(dbType);

  // Lazy import ensures unused DB driver is never loaded
  const bridge = dbType === 'sqlite'
    ? await import('./lib/db-bridge.sqlite.js')
    : await import('./lib/db-bridge.mysql.js');

  const app = createApp({
    loadMonitors: bridge.fetchDownMonitors,
    loadSslExpired: bridge.fetchSslExpired,
  });

  const port = Number(process.env.PORT ?? 4242);
  const server = app.listen(port, () => {
    console.log(`[server] http://localhost:${port}  (db=${dbType})`);
    console.log('[server] GET /api/down-monitors');
    console.log('[server] GET /api/ssl-expired');
  });

  // Graceful shutdown
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      console.log(`[server] ${signal} received, shutting down`);
      server.close(() => process.exit(0));
    });
  }
}

void main().catch((err: unknown) => {
  console.error('[server] fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});