import { RefreshIcon, WarnIcon } from './icons';

interface Props {
  error: string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-red-500 bg-red-50 px-3 py-3 text-sm leading-5 text-red-800 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300"
    >
      <WarnIcon />
      <span className="font-semibold">Could not load monitors</span>
      <span className="min-w-0 grow break-words">{error}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-red-600 px-3 text-xs leading-4 font-semibold text-red-800 transition-colors hover:bg-red-100 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900/40"
      >
        <RefreshIcon />
        Retry now
      </button>
    </div>
  );
}
