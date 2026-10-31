interface Props {
  /** Whether any filter (text query or category chip) is narrowing the list. */
  showClear: boolean;
  onClear: () => void;
  message: string;
}

export function EmptyState({ showClear, onClear, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-sm">
        {message}
      </p>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 font-semibold text-xs transition active:scale-95"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}