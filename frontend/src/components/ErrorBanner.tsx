import { RefreshIcon, WarnIcon } from './icons';

interface Props {
  error: string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-medium text-rose-800 dark:text-rose-200 shadow-sm"
    >
      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
        <WarnIcon />
      </div>
      <span className="font-bold text-slate-900 dark:text-white">Could not load monitors:</span>
      <span className="min-w-0 grow break-words font-mono text-[11px] text-slate-600 dark:text-slate-300">
        {error}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
      >
        <RefreshIcon className="w-3.5 h-3.5" />
        Retry now
      </button>
    </div>
  );
}