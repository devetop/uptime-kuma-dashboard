// Runnable self-check for the shared expiry helpers.
// Run: node --experimental-strip-types frontend/src/lib/expiry.test.ts
// Deliberately no `node:assert` import — the frontend tsconfig has no node types.
import { barWidth, computeExpiryStats, fleetCoverage, formatValidTo, getUrgencyInfo, pctOf, riskBreakdown } from './expiry.ts';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Tier boundaries: -1 expired, 0..7 critical, 8+ upcoming.
assert(getUrgencyInfo(-1).tier === 'expired', 'negative days is expired');
assert(getUrgencyInfo(0).tier === 'critical', '0 days is critical');
assert(getUrgencyInfo(7).tier === 'critical', '7 days is critical');
assert(getUrgencyInfo(8).tier === 'upcoming', '8 days is upcoming');
assert(getUrgencyInfo(1).label.startsWith('1 day ('), 'singular day label');

// Buckets + healthy remainder derived from the fleet, never negative.
const stats = computeExpiryStats(
  [{ days_left: -3 }, { days_left: 0 }, { days_left: 7 }, { days_left: 21 }],
  10,
);
assert(stats.expiredCount === 1 && stats.criticalCount === 2 && stats.upcomingCount === 1, 'buckets');
assert(stats.healthyCount === 6, 'healthy is fleet minus pending');
assert(computeExpiryStats([{ days_left: -1 }], 0).healthyCount === 0, 'healthy never negative');

// Percent formatting guards against a zero denominator (Infinity).
assert(pctOf(5, 10) === '50.0', 'percent has one decimal');
assert(pctOf(1, 0) === '0.0', 'zero denominator reads as unknown, not 100%');
assert(pctOf(0, 0) === '0.0', 'zero of zero is 0, not NaN');
assert(pctOf(3, -5) === '0.0', 'negative denominator is treated as unknown');

// Fleet coverage — the bug this replaced was `tracked / tracked` (always 100%).
// A partial fleet must NOT read as fully monitored.
const partial = fleetCoverage(3, 10);
assert(partial.badge === '30% Monitored', 'partial fleet reports real coverage');
assert(partial.barPct === '30%', 'coverage bar tracks the real share');
const empty = fleetCoverage(0, 0);
assert(empty.badge === '0% Monitored', 'empty fleet is not 100%');
assert(empty.barPct === '0%', 'empty fleet has no bar');
const tiny = fleetCoverage(1, 1000);
assert(tiny.barPct === '25%', 'small real share keeps its floor');
assert(fleetCoverage(99, 100).badge === '99% Monitored', 'near-full fleet is not rounded up to 100');

// Label is a parameter: same numbers, different (non-misleading) word. The
// Domain page reads "% Up"; the default stays "% Monitored" for other callers.
assert(fleetCoverage(0, 44, 'Up').badge === '0% Up', 'zero in-scope reads 0% Up, not 0% Monitored');
assert(fleetCoverage(15, 44, 'Up').badge === '34% Up', 'partial fleet reads 34% Up');

// Unparseable dates are returned as-is rather than showing "Invalid Date".
assert(formatValidTo('2025-05-20T14:00:00.000Z') === 'May 20, 2025 · 14:00 UTC', 'utc format');
assert(formatValidTo('not-a-date') === 'not-a-date', 'bad date falls through');

// Thin KPI bars: zero stays 0, a tiny non-zero count is nudged to minPct, 100 caps.
assert(barWidth(0, 100, 15) === '0%', 'empty bucket has no bar');
assert(barWidth(1, 1000, 15) === '15%', 'tiny count uses floor');
assert(barWidth(50, 100, 15) === '50%', 'normal count is exact');
assert(barWidth(200, 100, 15) === '100%', 'overflow is capped');

// Four-way split keeps the healthy remainder alongside the pending buckets.
const split = riskBreakdown(stats);
assert(split.length === 4, 'four risk buckets');
assert(split[0].count === 1 && split[3].count === 6, 'split counts');
assert(split[3].pct === '60.0', 'healthy share of fleet');

console.log('expiry.test.ts: all assertions passed');
