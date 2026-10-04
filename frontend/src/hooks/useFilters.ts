import { useMemo, useState } from 'react';
import type { MonitorView } from '../lib/types.ts';
import { classifyError, type ErrorCategory, type ErrorTypeInfo } from '../lib/errors.ts';

export interface CategoryCount extends ErrorTypeInfo {
  count: number;
}

/**
 * Category chips are derived from the categories actually present — a filter
 * chip with nothing to match is a dead control, and inventing empty chips
 * would fake structure the data does not have. Sorted most-frequent first,
 * label as tiebreak so the order is stable across refreshes.
 */
export function useCategoryCounts(rows: MonitorView[]): CategoryCount[] {
  return useMemo(() => {
    const counts = new Map<ErrorCategory, CategoryCount>();
    for (const r of rows) {
      const type = classifyError(r.msg);
      const seen = counts.get(type.category);
      if (seen) seen.count += 1;
      else counts.set(type.category, { ...type, count: 1 });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [rows]);
}

/**
 * Combined text + category predicate, pure so the console's filter semantics
 * have a runnable check. `active` empty means "no category filter".
 */
export function filterRows(
  rows: MonitorView[],
  query: string,
  active: Set<ErrorCategory>,
): MonitorView[] {
  const q = query.toLowerCase();
  return rows.filter(
    (m) =>
      (!q || m.monitor_name.toLowerCase().includes(q) || (m.msg ?? '').toLowerCase().includes(q)) &&
      (active.size === 0 || active.has(classifyError(m.msg).category)),
  );
}

/** Multi-select toggle set (Set semantics: click on = off, click off = on). */
export function useToggleSet() {
  const [active, setActive] = useState<Set<ErrorCategory>>(() => new Set());
  const toggle = (c: ErrorCategory) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  const clear = () => setActive(new Set());
  return { active, toggle, clear, any: active.size > 0 };
}
