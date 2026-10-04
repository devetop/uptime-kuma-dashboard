// Runnable self-check for the console filter semantics.
// Run: node --experimental-strip-types frontend/src/hooks/useFilters.test.ts
import { filterRows } from './useFilters.ts';
import type { MonitorView } from '../lib/types.ts';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const row = (id: number, name: string, msg: string | null): MonitorView =>
  ({ monitor_id: id, monitor_name: name, timestamp: 0, ping: 0, up: 0, down: 1, msg }) as MonitorView;

const ROWS = [
  row(1, 'api-orders', 'connect ECONNREFUSED 10.4.1.22:3000'),
  row(2, 'cdn-edge', 'getaddrinfo ENOTFOUND cdn.internal'),
  row(3, 'checkout-null', null),
];

assert(filterRows(ROWS, '', new Set()).length === 3, 'no filter keeps everything');
assert(filterRows(ROWS, 'API', new Set()).map((r) => r.monitor_id).join() === '1', 'query is case-insensitive');
assert(filterRows(ROWS, 'econnrefused', new Set()).length === 1, 'query matches message');
assert(filterRows(ROWS, '', new Set(['REFUSED'])).map((r) => r.monitor_id).join() === '1', 'chip filters by category');
// null msg classifies as OTHER — the fallback category must be filterable too.
assert(filterRows(ROWS, '', new Set(['OTHER'])).map((r) => r.monitor_id).join() === '3', 'null msg falls back to OTHER');
assert(
  filterRows(ROWS, 'edge', new Set(['REFUSED'])).length === 0,
  'query AND category compose (no row matches both)',
);
assert(filterRows(ROWS, 'edge', new Set(['REFUSED', 'DNS'])).map((r) => r.monitor_id).join() === '2', 'chips are OR-combined');

console.log('useFilters.test.ts: all assertions passed');
