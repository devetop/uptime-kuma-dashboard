import type { LiveSlot } from '../lib/types';
import { LiveState } from './LiveState';
import { MoonIcon, RefreshIcon, SunIcon, StarIcon, BellIcon } from './icons';

interface Props {
  slot: LiveSlot;
  loading: boolean;
  isDark: boolean;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

/**
 * Top Header Bar matching redesign.png:
 * Left: "Hello Oktavia" greeting + subtle status telemetry
 * Right: "Upgrade your plan" / Refresh action + notification bell with ping + Theme Toggle + User Avatar
 */
export function Header({ slot, loading, isDark, onRefresh, onToggleTheme }: Props) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2" data-purpose="header-section">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
          Hello Oktavia
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <LiveState slot={slot} /> · auto-refresh 5s
        </p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {/* Upgrade / Refresh Action Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh monitors"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
        >
          <StarIcon className="w-3.5 h-3.5 fill-brand-600 dark:fill-brand-400" />
          <span>{loading ? 'Refreshing...' : 'Upgrade your plan'}</span>
          <RefreshIcon spin={loading} className="w-3.5 h-3.5 ml-0.5 opacity-70" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition active:scale-95"
        >
          {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell with unread dot */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition active:scale-95"
        >
          <BellIcon className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
        </button>

        {/* User Avatar */}
        <div className="relative group cursor-pointer">
          <img
            alt="Oktavia Profile"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700 hover:ring-brand-500/50 transition"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-Qu_7laE1riwTNP5WmlJ-C9nwFjtFJbPBQ52I9IFGXnqVBZbkhjmdHW36BuxFs1QUf0L--4x5jEk5Xp5KmP9_hqmjaw2egiBMsK3tDsL3P00j6KAxix6OVxddV33HVsSVh-XG_onD72JZAxq-ZB39BPLQWNF0n3bVcw8mPOK8cW51lG1AMUihDCOA-D72goWP7Fer5SufPiWyBJI48RZcWEySpZjoHI7T9ZnXxQ_v"
          />
        </div>
      </div>
    </header>
  );
}