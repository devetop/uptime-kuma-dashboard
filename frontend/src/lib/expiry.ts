/**
 * Shared presentation logic for the expiry pages (SSL + Domain).
 * Pure functions only: no React, no fetch — so it stays trivially testable.
 */

export type UrgencyTier = 'expired' | 'critical' | 'upcoming';

export interface UrgencyInfo {
  tier: UrgencyTier;
  label: string;
  badgeClass: string;
  dotClass: string;
  iconContainerClass: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** UTC timestamp for the records tables, e.g. "May 20, 2025 · 14:00 UTC". */
export function formatValidTo(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} · ${hours}:${minutes} UTC`;
}

/** Risk tier for a certificate/domain deadline. Boundaries: <0 expired, <=7 critical. */
export function getUrgencyInfo(daysLeft: number): UrgencyInfo {
  if (daysLeft < 0) {
    return {
      tier: 'expired',
      label: `${daysLeft} days (Expired)`,
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
      iconContainerClass:
        'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400',
    };
  }
  if (daysLeft <= 7) {
    return {
      tier: 'critical',
      label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (Critical)`,
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      iconContainerClass:
        'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
    };
  }
  return {
    tier: 'upcoming',
    label: `${daysLeft} days (Warning)`,
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    dotClass: 'bg-sky-500',
    iconContainerClass:
      'bg-sky-100 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400',
  };
}

export interface ExpiryStats {
  expiredCount: number;
  criticalCount: number;
  upcomingCount: number;
  /** Fleet members with no pending deadline. Never negative. */
  healthyCount: number;
  totalFleet: number;
}

/**
 * Bucket the (already 21-day-filtered) records and derive the healthy remainder
 * from the whole fleet, so the risk bar always sums to the fleet, not the page.
 */
export function computeExpiryStats(
  items: readonly { days_left: number }[],
  totalFleet: number,
): ExpiryStats {
  let expiredCount = 0;
  let criticalCount = 0;
  let upcomingCount = 0;

  for (const item of items) {
    if (item.days_left < 0) expiredCount++;
    else if (item.days_left <= 7) criticalCount++;
    else upcomingCount++;
  }

  return {
    expiredCount,
    criticalCount,
    upcomingCount,
    healthyCount: Math.max(totalFleet - expiredCount - criticalCount - upcomingCount, 0),
    totalFleet,
  };
}

/**
 * Share `count` of `denominator` as a 1-decimal percent string.
 *
 * A zero denominator yields `0.0`, never `Infinity`/`NaN`. Note this is
 * deliberately pessimistic ("nothing is known") rather than the mathematically
 * tempting `count/1 => 100%`, which would report a full fleet from no data.
 */
export function pctOf(count: number, denominator: number): string {
  if (denominator <= 0) return '0.0';
  return ((count / denominator) * 100).toFixed(1);
}

/**
 * Corner-rounded, clamped bar width: visible when non-zero, capped at 100.
 * `count` may be a raw count (with `minPct` floor) or an already-computed
 * percentage whose floor lives in the caller.
 */
export function barWidth(count: number, total: number, minPct: number): string {
  const pct = (count / Math.max(total, 1)) * 100;
  return `${Math.min(Math.max(pct, count > 0 ? minPct : 0), 100)}%`;
}

/**
 * Fleet-coverage badge + bar for the KPI fleet card.
 *
 * `tracked` is how many entities of the fleet are visible to this page (the
 * denominator the API reports), `inScope` how many currently carry a deadline
 * record. Dividing an in-scope count by the fleet is the only meaningful
 * ratio here — `tracked / tracked` would always read 100% and hide a partial
 * fleet, which is exactly the bug this replaces.
 */
export function fleetCoverage(inScope: number, tracked: number) {
  const pct = tracked <= 0 ? 0 : Math.min((inScope / tracked) * 100, 100);
  return {
    badge: `${Math.round(pct)}% Monitored`,
    // Floor keeps a small-but-real share visible on the thin KPI bar.
    barPct: `${Math.min(Math.max(pct, inScope > 0 ? 25 : 0), 100)}%`,
  };
}

/**
 * Four-way risk split for the distribution bar/tiles: the pending buckets plus
 * the healthy remainder derived from the fleet size.
 */
export function riskBreakdown(stats: ExpiryStats) {
  const counts = [stats.expiredCount, stats.criticalCount, stats.upcomingCount, stats.healthyCount];
  return counts.map((c) => ({ count: c, pct: pctOf(c, stats.totalFleet) }));
}
