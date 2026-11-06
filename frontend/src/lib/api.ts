// Thin API client for the backend. Both the dev server (Vite proxy)
// and production should serve the API under the same origin prefix.
import type {
  DownMonitor,
  DownMonitorsResponse,
  QuickStats,
  SslExpiredItem,
  SslExpiredResponse,
} from "@shared/index.ts";
import type { MonitorId, MonitorView } from "./types";

const API_BASE = "/api";

/** Same response shape, with the monitor IDs branded at the parse boundary. */
export type MonitorsResponse = Omit<DownMonitorsResponse, "data"> & { data: MonitorView[] };

/** Runtime check for "is this a plain object we may index?" */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidStats(stats: unknown): stats is QuickStats {
  if (!isRecord(stats)) return false;
  const fields = ["up", "down", "pending", "maintenance", "unknown", "pause", "active"] as const;
  return fields.every((key) => {
    const v = stats[key];
    return typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  });
}

/**
 * Guard at the trust boundary: replaces the old `res.json() as Promise<...>`
 * assertion. Nothing unvalidated crosses into the UI.
 */
export function isDownMonitorsResponse(value: unknown): value is DownMonitorsResponse {
  if (!isRecord(value)) return false;
  if (!Number.isSafeInteger(value["total"]) || (value["total"] as number) < 0) return false;
  if (!isValidStats(value["stats"])) return false;
  const rows = value["data"];
  if (!Array.isArray(rows)) return false;
  return rows.every((row): row is DownMonitor => {
    if (!isRecord(row)) return false;
    return (
      typeof row["monitor_id"] === "number" &&
      typeof row["monitor_name"] === "string" &&
      typeof row["timestamp"] === "number" &&
      typeof row["ping"] === "number" &&
      (typeof row["up"] === "number" || typeof row["up"] === "undefined") &&
      (typeof row["down"] === "number" || typeof row["down"] === "undefined") &&
      (typeof row["msg"] === "string" || row["msg"] === null || typeof row["msg"] === "undefined")
    );
  });
}

/**
 * Runtime guard for GET /api/ssl-expired responses.
 */
export function isSslExpiredResponse(value: unknown): value is SslExpiredResponse {
  if (!isRecord(value)) return false;
  if (!Number.isSafeInteger(value["total"]) || (value["total"] as number) < 0) return false;
  if (!Number.isSafeInteger(value["active_tls_monitored"]) || (value["active_tls_monitored"] as number) < 0) return false;
  const rows = value["data"];
  if (!Array.isArray(rows)) return false;
  return rows.every((row): row is SslExpiredItem => {
    if (!isRecord(row)) return false;
    return (
      typeof row["monitor_id"] === "number" &&
      Number.isSafeInteger(row["monitor_id"]) &&
      typeof row["name"] === "string" &&
      typeof row["type"] === "string" &&
      typeof row["valid_to"] === "string" &&
      !Number.isNaN(Date.parse(row["valid_to"])) &&
      typeof row["days_left"] === "number" &&
      !Number.isNaN(row["days_left"])
    );
  });
}

/** Attach the ID brand. Runs only after the field passed a typeof check above. */
function toMonitorView(row: DownMonitor): MonitorView {
  return { ...row, monitor_id: row.monitor_id as MonitorId };
}

export async function fetchDownMonitors(): Promise<MonitorsResponse> {
  const res = await fetch(`${API_BASE}/down-monitors`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => undefined);
    const detail = isRecord(body) && typeof body["error"] === "string" ? body["error"] : undefined;
    throw new Error(detail ?? `HTTP ${res.status}`);
  }

  const raw: unknown = await res.json();
  if (!isDownMonitorsResponse(raw)) {
    throw new Error(`Unexpected response from ${API_BASE}/down-monitors`);
  }
  return { total: raw.total, data: raw.data.map(toMonitorView), stats: raw.stats };
}

export async function fetchSslExpired(): Promise<SslExpiredResponse> {
  const res = await fetch(`${API_BASE}/ssl-expired`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => undefined);
    const detail = isRecord(body) && typeof body["error"] === "string" ? body["error"] : undefined;
    throw new Error(detail ?? `HTTP ${res.status}`);
  }

  const raw: unknown = await res.json();
  if (!isSslExpiredResponse(raw)) {
    throw new Error(`Unexpected response from ${API_BASE}/ssl-expired`);
  }
  return {
    total: raw.total,
    data: raw.data,
    active_tls_monitored: raw.active_tls_monitored,
  };
}