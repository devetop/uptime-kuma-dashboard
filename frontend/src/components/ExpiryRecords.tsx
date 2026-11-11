import type { ReactElement } from 'react';
import { formatValidTo, getUrgencyInfo } from '../lib/expiry';

export interface ExpiryRecord {
  /** Stable React key — monitor id for SSL, the domain itself for Domain. */
  key: string;
  /** Primary identity: certificate/monitor name, or domain. */
  title: string;
  /** Small print under the title (e.g. `Monitor ID #12`). Omitted when absent. */
  meta?: string;
  /** ISO deadline rendered in the expiry column. */
  expiresAt: string;
  daysLeft: number;
  /** Optional 4th column + extra card line (notification status). */
  status?: string;
}

export interface ExpiryRecordLabels {
  /** Wide-table column headings, last one right-aligned. */
  headers: string[];
  /** Card line labels. `status` only rendered when a record carries one. */
  expiresAt: string;
  status?: string;
  /** Icon rendered inside the urgency-tinted square. */
  Icon: (p: { className?: string }) => ReactElement;
}

function UrgencyMark({
  daysLeft,
  Icon,
}: {
  daysLeft: number;
  Icon: (p: { className?: string }) => ReactElement;
}) {
  const { iconContainerClass } = getUrgencyInfo(daysLeft);
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconContainerClass}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function UrgencyBadge({ daysLeft }: { daysLeft: number }) {
  const { badgeClass, dotClass, label } = getUrgencyInfo(daysLeft);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

/** Wide-viewport records table (>= 45rem). */
export function ExpiryTable({ records, labels }: { records: ExpiryRecord[]; labels: ExpiryRecordLabels }) {
  const { headers, Icon } = labels;
  return (
    <div className="hidden wide:block border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 text-[11px] bg-slate-50/40 dark:bg-slate-800/20">
              {headers.map((h, i) => (
                <th key={h} scope="col" className={`py-3.5 px-6 ${i === headers.length - 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {records.map((r) => (
              <tr key={r.key} tabIndex={0} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                <td className="py-4 px-6 align-middle">
                  <div className="flex items-center gap-3">
                    <UrgencyMark daysLeft={r.daysLeft} Icon={Icon} />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white leading-snug">{r.title}</div>
                      {r.meta && <div className="text-[10px] text-slate-400 dark:text-slate-500">{r.meta}</div>}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatValidTo(r.expiresAt)}
                </td>
                <td className="py-4 px-6 align-middle whitespace-nowrap">
                  <UrgencyBadge daysLeft={r.daysLeft} />
                </td>
                {r.status !== undefined && (
                  <td className="py-4 px-6 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {r.status}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Narrow-viewport records cards (< 45rem). */
export function ExpiryCards({ records, labels }: { records: ExpiryRecord[]; labels: ExpiryRecordLabels }) {
  const { Icon, expiresAt: expiresLabel, status: statusLabel } = labels;
  return (
    <div className="block wide:hidden space-y-3">
      {records.map((r) => (
        <article
          key={r.key}
          tabIndex={0}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <UrgencyMark daysLeft={r.daysLeft} Icon={Icon} />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{r.title}</h4>
                {r.meta && <p className="text-[10px] text-slate-400">{r.meta}</p>}
              </div>
            </div>
            <UrgencyBadge daysLeft={r.daysLeft} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{expiresLabel}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatValidTo(r.expiresAt)}
            </span>
          </div>
          {r.status !== undefined && statusLabel && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{statusLabel}:</span>
              <span className="text-slate-600 dark:text-slate-300">{r.status}</span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
