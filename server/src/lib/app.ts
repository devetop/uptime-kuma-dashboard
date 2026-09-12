import express, { type Request, type Response } from 'express';
import type { DownMonitor, DownMonitorsResponse, ApiErrorResponse } from '@shared/index.ts';

/** Cache TTL: 5s prevents hammering the DB on fast auto-refresh cycles */
const CACHE_TTL_MS = 5_000;

interface CacheEntry {
  at: number;
  payload: DownMonitorsResponse;
}

let cache: CacheEntry | null = null;

/** Loader may be sync (sqlite) or async (mysql). */
export type MonitorLoader = () => Promise<DownMonitor[]> | DownMonitor[];

/**
 * Cached loader that deduplicates concurrent requests within the TTL window.
 * On loader failure, serves stale cache if present (avoids blank dashboards).
 */
async function loadMonitors(loader: MonitorLoader): Promise<DownMonitorsResponse> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.payload;
  }

  let data: DownMonitor[];
  try {
    data = await loader();
  } catch (err) {
    if (cache) return cache.payload;
    throw err;
  }

  const payload: DownMonitorsResponse = { total: data.length, data };
  cache = { at: now, payload };
  return payload;
}

export function createApp(loader: MonitorLoader) {
  const app = express();
  app.disable('x-powered-by');

  // CORS — allows the frontend dev server origin, defaults to wildcard
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN ?? '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get('/api/down-monitors', async (_req: Request, res: Response) => {
    try {
      res.json(await loadMonitors(loader));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const body: ApiErrorResponse = { error: `Failed to load monitors: ${message}` };
      res.status(500).json(body);
    }
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  return app;
}
