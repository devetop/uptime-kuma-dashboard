import type { ReactNode } from 'react';
import { MoonIcon, RefreshIcon, SunIcon } from './icons';

interface PageHeaderProps {
  title: string;
  /** Plain copy for the expiry pages, or a node when the subtitle renders live state. */
  subtitle: ReactNode;
  loading: boolean;
  refreshLabel: string;
  onRefresh: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

/** Title + refresh + theme toggle. Shared by the dashboard and both expiry pages. */
export function PageHeader({
  title,
  subtitle,
  loading,
  refreshLabel,
  onRefresh,
  isDark,
  onToggleTheme,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2" data-purpose="header-section">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label={refreshLabel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
        >
          <span>{loading ? 'Refreshing...' : refreshLabel}</span>
          <RefreshIcon spin={loading} className="w-3.5 h-3.5 ml-0.5 opacity-70" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition active:scale-95"
        >
          {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}

/** Inline retry strip for a failed poll on a loaded page. */
export function InlineError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
      <span>{error}</span>
      <button type="button" onClick={onRetry} className="font-semibold underline ml-2">
        Retry
      </button>
    </div>
  );
}

interface SearchBarProps {
  id: string;
  placeholder: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  /** Count after filtering. */
  shown: number;
  /** Denominator for the "Showing X of Y" copy. */
  total: number;
  suffix: string;
}

/** Search input + result count + single clear affordance (AGENTS.md contract). */
export function SearchBar({
  id,
  placeholder,
  label,
  value,
  onChange,
  onClear,
  shown,
  total,
  suffix,
}: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div className="relative flex-1 max-w-md">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="w-full min-h-11 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{shown}</strong> of{' '}
          <span className="font-mono">{total}</span> {suffix}
        </span>
        {value.trim() && (
          <button
            type="button"
            onClick={onClear}
            className="text-brand-600 dark:text-brand-400 font-semibold underline hover:text-brand-700 ml-1"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
