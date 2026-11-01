// Runnable self-check for the API trust-boundary guard.
// Run: node --experimental-strip-types frontend/src/lib/api.test.ts
// Deliberately no `node:assert` import — the frontend tsconfig has no node types.
import { isDownMonitorsResponse } from "./api.ts";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const okRow = {
  monitor_id: 1,
  monitor_name: "site",
  timestamp: 1_759_000_000,
  ping: 12.5,
  up: 0,
  down: 4,
  msg: "connect ECONNREFUSED 1.2.3.4:443",
};

const okStats = {
  up: 42,
  down: 1,
  pending: 0,
  maintenance: 0,
  unknown: 0,
  pause: 12,
  active: 43,
};

assert(isDownMonitorsResponse({ total: 1, data: [okRow], stats: okStats }), "valid payload accepted");
assert(isDownMonitorsResponse({ total: 0, data: [], stats: okStats }), "empty payload accepted");
assert(isDownMonitorsResponse({ total: 1, data: [{ ...okRow, up: undefined, down: undefined }], stats: okStats }), "optional counters accepted");

// Every shape below must be REJECTED — the old bare `as` assertion let them all through.
[
  null,
  undefined,
  [],
  '{"total":0,"data":[]}',
  { total: "1", data: [], stats: okStats },
  { total: -1, data: [], stats: okStats },
  { total: 1.5, data: [], stats: okStats },
  { total: Number.NaN, data: [], stats: okStats },
  { total: 1, stats: okStats },
  { total: 1, data: {}, stats: okStats },
  { total: 1, data: [null], stats: okStats },
  { total: 1, data: [{ ...okRow, monitor_id: "1" }], stats: okStats },
  { total: 1, data: [{ ...okRow, monitor_name: undefined }], stats: okStats },
  { total: 1, data: [{ ...okRow, msg: 42 }], stats: okStats },
  // Missing or invalid stats cases
  { total: 1, data: [okRow] }, // missing stats
  { total: 1, data: [okRow], stats: null },
  { total: 1, data: [okRow], stats: undefined },
  { total: 1, data: [okRow], stats: {} },
  { total: 1, data: [okRow], stats: "not-an-object" },
  { total: 1, data: [okRow], stats: { ...okStats, up: -1 } }, // negative field
  { total: 1, data: [okRow], stats: { ...okStats, down: 1.5 } }, // float field
  { total: 1, data: [okRow], stats: { ...okStats, pause: "12" } }, // string field
  { total: 1, data: [okRow], stats: { ...okStats, up: undefined } }, // missing field
].forEach((bad, i) => {
  assert(isDownMonitorsResponse(bad) === false, `rejects #${i}: ${JSON.stringify(bad)}`);
});

console.log("api.test.ts: all assertions passed");
