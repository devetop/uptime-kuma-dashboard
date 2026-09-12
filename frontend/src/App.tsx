import { useEffect, useMemo, useState } from 'react';
import type { DownMonitor } from '@shared/index.ts';
import { useDownMonitors } from './hooks/useDownMonitors';
import { DownMonitorRow } from './components/DownMonitorRow';
import { relativeTime, absoluteTime } from './lib/time';

export function App() {
  const [now, setNow] = useState(() => Date.now());
  const { data, total, loading, error, reload } = useDownMonitors(30_000);

  // Update relative timestamps each second without re-fetching
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.monitor_name.toLowerCase().includes(q) ||
        (m.msg ?? '').toLowerCase().includes(q),
    );
  }, [data, filter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Down Monitors</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading
                ? 'Loading…'
                : `${total} monitor${total === 1 ? '' : 's'} currently down`}
            </p>
          </div>
          <span className="sm:ml-auto" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshIcon />
              Refresh
            </button>
            <span className="text-xs text-slate-400">Auto-refresh: 30s</span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Search */}
        <input
          type="search"
          placeholder="Search by monitor name or error message…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Total count + visible count */}
        <div className="flex justify-between items-center text-sm text-slate-600">
          <span>
            Showing <strong>{filtered.length}</strong> / {total} monitors down
          </span>
          {loading && <span>Refreshing…</span>}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Monitor</th>
                  <th className="px-4 py-2 text-left">Last Down</th>
                  <th className="px-4 py-2 text-left">Ping</th>
                  <th className="px-4 py-2 text-left">Error Message</th>
                  <th className="px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                      {loading ? 'Refreshing monitor data…' : 'No monitors currently down 🎉'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((m: DownMonitor) => (
                    <DownMonitorRow
                      key={m.monitor_id}
                      monitor={m}
                      relativeTime={relativeTime(m.timestamp, now)}
                      absoluteTime={absoluteTime(m.timestamp)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}