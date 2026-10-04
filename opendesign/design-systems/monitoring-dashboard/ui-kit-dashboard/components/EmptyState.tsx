interface Props {
  query: string;
  onClear: () => void;
  message: string;
}

export function EmptyState({ query, onClear, message }: Props) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 py-8 text-center text-sm leading-5 text-slate-700 dark:text-slate-300">
      {query ? (
        <>
          <span>{message}</span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
          >
            Clear filter
          </button>
        </>
      ) : (
        <span>{message}</span>
      )}
    </p>
  );
}
