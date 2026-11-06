import express, { type Request, type Response } from "express";
import type {
  DownMonitor,
  DownMonitorsResponse,
  ApiErrorResponse,
  QuickStats,
  SslExpiredItem,
  SslExpiredResponse,
} from "@shared/index.ts";

/** Cache TTL: 5s prevents hammering the DB on fast auto-refresh cycles */
const CACHE_TTL_MS = 5_000;

interface CacheEntry<T> {
  at: number;
  payload: T;
}

let monitorsCache: CacheEntry<DownMonitorsResponse> | null = null;
let sslCache: CacheEntry<SslExpiredResponse> | null = null;

export interface LoadedData {
  monitors: DownMonitor[];
  stats: QuickStats;
}

/** Loader may be sync (sqlite) or async (mysql). */
export type MonitorLoader = () => Promise<LoadedData> | LoadedData;
export interface SslExpiredData {
  items: SslExpiredItem[];
  activeTlsMonitored: number;
}

export type SslExpiredLoader = () => Promise<SslExpiredData> | SslExpiredData;

export interface AppLoaders {
  loadMonitors: MonitorLoader;
  loadSslExpired?: SslExpiredLoader;
}

/**
 * Cached loader that deduplicates concurrent requests within the TTL window.
 * On loader failure, serves stale cache if present (avoids blank dashboards).
 */
async function loadMonitorsCached(loader: MonitorLoader): Promise<DownMonitorsResponse> {
  const now = Date.now();
  if (monitorsCache && now - monitorsCache.at < CACHE_TTL_MS) {
    return monitorsCache.payload;
  }

  let data: LoadedData;
  try {
    data = await loader();
  } catch (err) {
    if (monitorsCache) return monitorsCache.payload;
    throw err;
  }

  const payload: DownMonitorsResponse = {
    total: data.monitors.length,
    data: data.monitors,
    stats: data.stats,
  };
  monitorsCache = { at: now, payload };
  return payload;
}

async function loadSslExpiredCached(loader: SslExpiredLoader): Promise<SslExpiredResponse> {
  const now = Date.now();
  if (sslCache && now - sslCache.at < CACHE_TTL_MS) {
    return sslCache.payload;
  }

  let data: SslExpiredData;
  try {
    data = await loader();
  } catch (err) {
    if (sslCache) return sslCache.payload;
    throw err;
  }

  const payload: SslExpiredResponse = {
    total: data.items.length,
    data: data.items,
    active_tls_monitored: data.activeTlsMonitored,
  };
  sslCache = { at: now, payload };
  return payload;
}

export function createApp(loaders: MonitorLoader | AppLoaders) {
  const app = express();
  app.disable("x-powered-by");

  const monitorLoader: MonitorLoader =
    typeof loaders === "function" ? loaders : loaders.loadMonitors;
  const sslLoader: SslExpiredLoader | undefined =
    typeof loaders === "object" ? loaders.loadSslExpired : undefined;

  // CORS — allows the frontend dev server origin, defaults to wildcard
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/api/down-monitors", async (_req: Request, res: Response) => {
    try {
      res.json(await loadMonitorsCached(monitorLoader));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const body: ApiErrorResponse = { error: `Failed to load monitors: ${message}` };
      res.status(500).json(body);
    }
  });

  if (sslLoader) {
    app.get("/api/ssl-expired", async (_req: Request, res: Response) => {
      try {
        res.json(await loadSslExpiredCached(sslLoader));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const body: ApiErrorResponse = { error: `Failed to load SSL expired monitors: ${message}` };
        res.status(500).json(body);
      }
    });
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  return app;
}