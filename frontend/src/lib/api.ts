// Thin API client for the backend. Both the dev server (Vite proxy)
// and production should serve the API under the same origin prefix.
import type { DownMonitor, DownMonitorsResponse } from '@shared/index.ts';
import type { MonitorId, MonitorView } from './types';

const API_BASE = '/api';

/** Same response shape, with the monitor IDs branded at the parse boundary. */
export type MonitorsResponse = Omit<DownMonitorsResponse, 'data'> & { data: MonitorView[] };

/** Runtime check for "is this a plain object we may index?" */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Guard at the trust boundary: replaces the old `res.json() as Promise<...>`
 * assertion. Nothing unvalidated crosses into the UI.
 */
export function isDownMonitorsResponse(value: unknown): value is DownMonitorsResponse {
  if (!isRecord(value)) return false;
  if (!Number.isSafeInteger(value['total']) || (value['total'] as number) < 0) return false;
  const rows = value['data'];
  if (!Array.isArray(rows)) return false;
  return rows.every((row): row is DownMonitor => {
    if (!isRecord(row)) return false;
    return (
      typeof row['monitor_id'] === 'number' &&
      typeof row['monitor_name'] === 'string' &&
      typeof row['timestamp'] === 'number' &&
      typeof row['ping'] === 'number' &&
      (typeof row['up'] === 'number' || typeof row['up'] === 'undefined') &&
      (typeof row['down'] === 'number' || typeof row['down'] === 'undefined') &&
      (typeof row['msg'] === 'string' || row['msg'] === null || typeof row['msg'] === 'undefined')
    );
  });
}

/** Attach the ID brand. Runs only after the field passed a typeof check above. */
function toMonitorView(row: DownMonitor): MonitorView {
  return { ...row, monitor_id: row.monitor_id as MonitorId };
}

export async function fetchDownMonitors(): Promise<MonitorsResponse> {
  const res = await fetch(`${API_BASE}/down-monitors`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => undefined);
    const detail = isRecord(body) && typeof body['error'] === 'string' ? body['error'] : undefined;
    throw new Error(detail ?? `HTTP ${res.status}`);
  }

  const raw: unknown = await res.json();
  if (!isDownMonitorsResponse(raw)) {
    throw new Error(`Unexpected response from ${API_BASE}/down-monitors`);
  }
  return { total: raw.total, data: raw.data.map(toMonitorView) };
}
