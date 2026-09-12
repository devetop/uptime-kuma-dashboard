// Thin API client for the backend. Both the dev server (Vite proxy)
// and production should serve the API under the same origin prefix.
import type { DownMonitor } from '@shared/index.ts';

export interface DownMonitorsResponse {
  total: number;
  data: DownMonitor[];
}

export interface ApiErrorResponse {
  error: string;
}

const API_BASE = '/api';

export async function fetchDownMonitors(): Promise<DownMonitorsResponse> {
  const res = await fetch(`${API_BASE}/down-monitors`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const body: ApiErrorResponse = await res
      .json()
      .catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DownMonitorsResponse>;
}