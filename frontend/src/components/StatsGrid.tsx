import type { QuickStats } from '@shared/index.ts';
import { barWidth } from '../lib/expiry';

type Counts = Pick<QuickStats, 'up' | 'down' | 'pause'>;

/**
 * Dashboard KPI strip: Up / Down / Paused from `stats`, Global Uptime still a
 * mock. The bar length is presentation only — `totalMonitors` is the shared
 * denominator so the three counts read as shares of the same fleet.
 */
export function StatsGrid({
  stats,
  totalMonitors,
  globalUptime,
}: {
  stats: QuickStats | null;
  totalMonitors: number;
  globalUptime: string;
}) {
  const counts: Counts = {
    up: stats?.up ?? 0,
    down: stats?.down ?? 0,
    pause: stats?.pause ?? 0,
  };

  // Uptime is already a percentage, so it is its own bar width. Running it
  // through the count-based bar would divide it by the fleet a second time
  // (98.45 / 55 * 100 => clamped to a permanent 100%).
  const uptimePct = Number.parseFloat(globalUptime);
  const uptimeBar = Number.isFinite(uptimePct)
    ? `${Math.min(Math.max(uptimePct, uptimePct > 0 ? 5 : 0), 100)}%`
    : '0%';

  const cards = [
    { label: 'Up', value: stats?.up ?? '—', ring: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40', pct: barWidth(counts.up, totalMonitors, 5) },
    { label: 'Down', value: stats?.down ?? '—', ring: 'bg-rose-500 ring-rose-100 dark:ring-rose-900/40', pct: barWidth(counts.down, totalMonitors, 5) },
    { label: 'Paused', value: stats?.pause ?? '—', ring: 'bg-amber-500 ring-amber-100 dark:ring-amber-900/40', pct: barWidth(counts.pause, totalMonitors, 5) },
    { label: 'Global Uptime', value: globalUptime, ring: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40', pct: uptimeBar },
  ];

  return (
    <section aria-label="Quick statistics overview" data-purpose="kpi-metrics-grid">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition"
          >
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide block mb-3">
              {c.label}
            </span>
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                <span className={`w-3.5 h-3.5 rounded-full ring-4 ${c.ring}`} />
              </div>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {c.value}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className={`${c.ring.split(' ')[0]} h-full rounded-full transition-all`} style={{ width: c.pct }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
