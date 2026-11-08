import type { DownMonitor, QuickStats, SslExpiredItem, DomainExpiredItem } from "@shared/index.ts";

/** Raw row shape returned by DOWN_MONITORS_SQL */
export interface RawMonitorRow {
  monitor_id: number;
  monitor_name: string | null;
  timestamp: number;
  ping: number | null;
  up: number | null;
  down: number | null;
  msg: string | null;
}

/** Raw row shape returned by QUICK_STATS_SQL */
export interface RawQuickStatsRow {
  up?: number | string | null;
  down?: number | string | null;
  pending?: number | string | null;
  maintenance?: number | string | null;
  unknown?: number | string | null;
  pause?: number | string | null;
  active?: number | string | null;
}

/** Raw row shape returned by ACTIVE_TLS_MONITORED_SQL */
export interface RawActiveTlsRow {
  active_tls_monitored?: number | string | null;
}

/** Coerce the active-TLS count row to a non-negative safe integer. */
export function mapActiveTlsMonitored(row: RawActiveTlsRow | null | undefined): number {
  const n = Number(row?.active_tls_monitored);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

/** Raw row shape returned by ACTIVE_DOMAINS_MONITORED_SQL */
export interface RawActiveDomainsRow {
  active_domains_monitored?: number | string | null;
}

/** Coerce the active-domains count row to a non-negative safe integer. */
export function mapActiveDomainsMonitored(row: RawActiveDomainsRow | null | undefined): number {
  const n = Number(row?.active_domains_monitored);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

/** Raw row shape returned by SSL_EXPIRED_*_SQL */
export interface RawSslExpiredRow {
  monitor_id?: number | string | null;
  name?: string | null;
  type?: string | null;
  valid_to?: string | null;
  days_left?: number | string | null;
}

/** Raw row shape returned by DOMAIN_EXPIRED_*_SQL */
export interface RawDomainExpiredRow {
  domain?: string | null;
  expiry?: string | null;
  days_left?: number | string | null;
  last_deadline_sent?: string | null;
}

/**
 * Coerce raw DB rows into the typed domain model.
 *
 * Note: `up`/`down` are smallint *counts* in Uptime Kuma's schema
 * (not strictly boolean), so we coerce defensively with `??` defaults.
 */
export function mapDownMonitorRows(rows: readonly RawMonitorRow[]): DownMonitor[] {
  return rows.map((r) => ({
    monitor_id:   Number(r.monitor_id),
    monitor_name: String(r.monitor_name ?? ""),
    timestamp:    Number(r.timestamp),
    ping:         r.ping == null ? 0 : Number(r.ping),
    up:           r.up == null ? 0 : Number(r.up),
    down:         r.down == null ? 0 : Number(r.down),
    msg:          r.msg ?? null,
  }));
}

/**
 * Coerce raw quick stats row into the QuickStats domain model.
 * Coerces each column to Number with a fallback of 0.
 */
export function mapQuickStats(row: RawQuickStatsRow | null | undefined): QuickStats {
  return {
    up:          row?.up == null ? 0 : Number(row.up) || 0,
    down:        row?.down == null ? 0 : Number(row.down) || 0,
    pending:     row?.pending == null ? 0 : Number(row.pending) || 0,
    maintenance: row?.maintenance == null ? 0 : Number(row.maintenance) || 0,
    unknown:     row?.unknown == null ? 0 : Number(row.unknown) || 0,
    pause:       row?.pause == null ? 0 : Number(row.pause) || 0,
    active:      row?.active == null ? 0 : Number(row.active) || 0,
  };
}

/**
 * Coerce raw SSL expired rows into typed SslExpiredItem domain models.
 * Filters out entries with missing or unparseable valid_to / days_left values,
 * ensuring values are safe numbers and never NaN.
 */
export function mapSslExpiredRows(rows: readonly RawSslExpiredRow[]): SslExpiredItem[] {
  const result: SslExpiredItem[] = [];
  for (const r of rows) {
    if (r.monitor_id == null || r.valid_to == null || r.days_left == null) continue;
    const monitorId = Number(r.monitor_id);
    const daysLeft = Number(r.days_left);
    if (!Number.isSafeInteger(monitorId) || Number.isNaN(daysLeft)) continue;

    // Check if valid_to parses to a valid timestamp
    const dateParsed = Date.parse(String(r.valid_to));
    if (Number.isNaN(dateParsed)) continue;

    result.push({
      monitor_id: monitorId,
      name: String(r.name ?? ""),
      type: String(r.type ?? ""),
      valid_to: String(r.valid_to),
      days_left: Math.round(daysLeft),
    });
  }
  return result;
}

/**
 * Coerce raw domain expired rows into typed DomainExpiredItem domain models.
 * Filters out entries with missing or unparseable expiry / days_left values,
 * ensuring values are safe numbers and never NaN.
 */
export function mapDomainExpiredRows(rows: readonly RawDomainExpiredRow[]): DomainExpiredItem[] {
  const result: DomainExpiredItem[] = [];
  for (const r of rows) {
    if (!r.domain || r.expiry == null || r.days_left == null) continue;
    const daysLeft = Number(r.days_left);
    if (Number.isNaN(daysLeft)) continue;

    // Check if expiry parses to a valid timestamp
    const dateParsed = Date.parse(String(r.expiry));
    if (Number.isNaN(dateParsed)) continue;

    result.push({
      domain: String(r.domain),
      expiry: String(r.expiry),
      days_left: Math.round(daysLeft),
      last_deadline_sent: r.last_deadline_sent != null ? String(r.last_deadline_sent) : null,
    });
  }
  return result;
}