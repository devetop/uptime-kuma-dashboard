import type { ExpiryStats } from '../lib/expiry';
import { barWidth, riskBreakdown, type UrgencyTier } from '../lib/expiry';

/**
 * Risk severity ordering shared by every expiry surface. `minPct` keeps a
 * non-zero count visible on the thin KPI bars (a 1/900 slice is 0.1% wide).
 */
export const RISK_TIERS = [
  { tier: 'expired', dotClass: 'bg-rose-500', minPct: 15 },
  { tier: 'critical', dotClass: 'bg-amber-500', minPct: 25 },
  { tier: 'upcoming', dotClass: 'bg-sky-500', minPct: 40 },
] as const satisfies readonly { tier: UrgencyTier; dotClass: string; minPct: number }[];

// Legend/tile copy, indexed to RISK_TIERS then the healthy bucket.
const LEGEND = ['Expired', '≤ 7 Days', '≤ 21 Days', 'Healthy'] as const;
const TILE_TITLES = ['Overdue', 'Immediate Action', 'Scheduled Renew', 'Secured'] as const;
const TILE_TONES = [
  'text-rose-600 dark:text-rose-400',
  'text-amber-600 dark:text-amber-400',
  'text-sky-600 dark:text-sky-400',
  'text-emerald-600 dark:text-emerald-400',
] as const;
const BAR_FILLS = ['bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'] as const;
/** Minimum visible width for a non-zero slice on the distribution bar. */
const BAR_MIN_PCT = [3, 4, 8] as const;

export { barWidth };

function KpiCard({
  label,
  dotClass,
  value,
  valueClass,
  badge,
  badgeClass,
  barPct,
}: {
  label: string;
  dotClass: string;
  value: number | string;
  valueClass: string;
  badge?: string;
  badgeClass?: string;
  barPct: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
          {label}
        </span>
        <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className={`text-3xl font-extrabold tracking-tight ${valueClass}`}>{value}</span>
        {badge && (
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className={`${dotClass} h-full rounded-full transition-all`} style={{ width: barPct }} />
      </div>
    </div>
  );
}

interface KpiGridProps {
  /** Card 1 label differs per domain: "Expired Certificates" vs "Expired Domains". */
  expiredLabel: string;
  stats: ExpiryStats;
  /** Denominator for the three risk bars (the filtered record count). */
  total: number;
  /** Card 4 — the fleet card, whose badge and bar are page-specific. */
  fleet: { label: string; badge: string; badgeClass: string; barPct: string };
}

const RISK_BADGES = [
  {
    label: 'Action Req.',
    valueClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  {
    label: 'Severe',
    valueClass: 'text-slate-800 dark:text-white',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  {
    label: 'Pending',
    valueClass: 'text-slate-800 dark:text-white',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  },
] as const;

/** The 4-card KPI strip at the top of both expiry pages. */
export function ExpiryKpiGrid({ expiredLabel, stats, total, fleet }: KpiGridProps) {
  const counts = [stats.expiredCount, stats.criticalCount, stats.upcomingCount];
  const labels = [expiredLabel, 'Critical Expiry (≤ 7d)', 'Upcoming Expiry (≤ 21d)'];

  return (
    <section aria-label="Expiry statistics overview" data-purpose="kpi-metrics-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 wide:grid-cols-4 gap-4">
        {RISK_TIERS.map((tier, i) => (
          <KpiCard
            key={tier.tier}
            label={labels[i]}
            dotClass={tier.dotClass}
            value={counts[i]}
            valueClass={RISK_BADGES[i].valueClass}
            badge={RISK_BADGES[i].label}
            badgeClass={RISK_BADGES[i].badgeClass}
            barPct={barWidth(counts[i], total, tier.minPct)}
          />
        ))}
        <KpiCard
          label={fleet.label}
          dotClass="bg-emerald-500"
          value={stats.totalFleet}
          valueClass="text-slate-800 dark:text-white"
          badge={fleet.badge}
          badgeClass={fleet.badgeClass}
          barPct={fleet.barPct}
        />
      </div>
    </section>
  );
}

interface DistributionProps {
  heading: string;
  subtitle: string;
  stats: ExpiryStats;
  /** One caption per risk tile, expired -> upcoming, plus the healthy tile. */
  tileCaptions: [string, string, string, string];
}

/** Fleet-wide risk bar + percentage tiles, shared by SSL and Domain pages. */
export function RiskDistribution({ heading, subtitle, stats, tileCaptions }: DistributionProps) {
  const buckets = riskBreakdown(stats);

  return (
    <section
      aria-label={heading}
      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{heading}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((text, i) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${BAR_FILLS[i]}`} />
              <span>{text} ({buckets[i].count})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex gap-1 p-0.5">
        {buckets.slice(0, 3).map((b, i) => (
          <div
            key={BAR_FILLS[i]}
            className={`${BAR_FILLS[i]} h-full transition-all ${i === 0 ? 'rounded-l-full' : ''}`}
            style={{ width: `${Math.max(Number(b.pct), b.count > 0 ? BAR_MIN_PCT[i] : 0)}%` }}
            title={`${LEGEND[i]}: ${b.count}`}
          />
        ))}
        <div
          className="bg-emerald-500 h-full rounded-r-full transition-all flex-1"
          title={`Healthy: ${stats.healthyCount}`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {TILE_TITLES.map((title, i) => (
          <div
            key={title}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col"
          >
            <span className={`text-[11px] font-semibold ${TILE_TONES[i]}`}>{title}</span>
            <span className="text-lg font-bold text-slate-800 dark:text-white">{buckets[i].pct}%</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{tileCaptions[i]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
