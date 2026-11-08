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

export interface QuickStats {
  up: number;
  down: number;
  pending: number;
  maintenance: number;
  unknown: number;
  pause: number;
  active: number;
}

/** GET /api/down-monitors successful response */
export interface DownMonitorsResponse {
  total: number;
  data: DownMonitor[];
  stats: QuickStats;
}

/** GET /api/down-monitors error response */
export interface ApiErrorResponse {
  error: string;
}

export interface SslExpiredItem {
  monitor_id: number;
  name: string;
  type: string;
  valid_to: string;
  days_left: number;
}

/** GET /api/ssl-expired successful response */
export interface SslExpiredResponse {
  total: number;
  data: SslExpiredItem[];
  /** Active monitors with recorded TLS info (the whole monitored fleet) */
  active_tls_monitored: number;
}

export interface DomainExpiredItem {
  domain: string;
  expiry: string;
  days_left: number;
  last_deadline_sent: string | null;
}

/** GET /api/domain-expired successful response */
export interface DomainExpiredResponse {
  total: number;
  data: DomainExpiredItem[];
  /** Active domains monitored in fleet */
  active_domains_monitored: number;
}