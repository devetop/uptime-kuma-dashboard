// Runnable self-check for the API trust-boundary guard.
// Run: node --experimental-strip-types frontend/src/lib/api.test.ts
// Deliberately no `node:assert` import — the frontend tsconfig has no node types.
import { isDownMonitorsResponse } from './api.ts';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const okRow = {
  monitor_id: 1,
  monitor_name: 'site',
  timestamp: 1_759_000_000,
  ping: 12.5,
  up: 0,
  down: 4,
  msg: 'connect ECONNREFUSED 1.2.3.4:443',
};

assert(isDownMonitorsResponse({ total: 1, data: [okRow] }), 'valid payload accepted');
assert(isDownMonitorsResponse({ total: 0, data: [] }), 'empty payload accepted');
assert(isDownMonitorsResponse({ total: 1, data: [{ ...okRow, up: undefined, down: undefined }] }), 'optional counters accepted');

// Every shape below must be REJECTED — the old bare `as` assertion let them all through.
[
  null,
  undefined,
  [],
  '{"total":0,"data":[]}',
  { total: '1', data: [] },
  { total: -1, data: [] },
  { total: 1.5, data: [] },
  { total: Number.NaN, data: [] },
  { total: 1 },
  { total: 1, data: {} },
  { total: 1, data: [null] },
  { total: 1, data: [{ ...okRow, monitor_id: '1' }] },
  { total: 1, data: [{ ...okRow, monitor_name: undefined }] },
  { total: 1, data: [{ ...okRow, msg: 42 }] },
].forEach((bad, i) => {
  assert(isDownMonitorsResponse(bad) === false, `rejects #${i}: ${JSON.stringify(bad)}`);
});

console.log('api.test.ts: all assertions passed');
