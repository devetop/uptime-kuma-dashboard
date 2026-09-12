/**
 * Down monitors domain types, shared between server and frontend.
 * Kept in shared/ so both sides use one source of truth.
 */

export interface DownMonitor {
  monitor_id: number;
  monitor_name: string;
  /** Unix timestamp (seconds) of the last minutely stat */
  timestamp: number;
  /** Average ping in ms during that minute (0 when down) */
  ping: number;
  /** Count of "up" heartbeats in the sampled minute */
  up: number;
  /** Count of "down" heartbeats in the sampled minute */
  down: number;
  /** Last heartbeat message (e.g. "connect ECONNREFUSED 1.2.3.4:443") */
  msg: string | null;
}

/** GET /api/down-monitors successful response */
export interface DownMonitorsResponse {
  total: number;
  data: DownMonitor[];
}

/** GET /api/down-monitors error response */
export interface ApiErrorResponse {
  error: string;
}
