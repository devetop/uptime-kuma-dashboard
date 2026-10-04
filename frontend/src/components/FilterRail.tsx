import type { CountState } from '../lib/types';
import type { ErrorCategory } from '../lib/errors';
import type { CategoryCount } from '../hooks/useFilters';

interface Props {
  count: CountState;
  cats: CategoryCount[];
  active: Set<ErrorCategory>;
  onToggle: (c: ErrorCategory) => void;
}

/* Big number wears the same verified badge tokens as the REFUSED/OTHER categories:
   red when something is down, slate when it isn't or when a failed first load
   means claiming a number would lie. */
const TONE = {
  alarm: 'text-red-800 dark:text-red-300',
  neutral: 'text-slate-800 dark:text-slate-200',
} as const;

/**
 * Direction B rail: the summary count and the error-type filters. At < 45rem it
 * re-flows into a horizontal chip band above the list — same content, no drawer.
 * The mockup hid the count on narrow screens; the port keeps it visible (first
 * cell of the band) because on this app the count *is* the payload.
 */
export function FilterRail({ count, cats, active, onToggle }: Props) {
  const tone = count.state === 'count' && count.total > 0 ? TONE.alarm : TONE.neutral;

  return (
    <aside
      aria-label="Summary and filters"
      className="flex w-full items-center gap-3 overflow-x-auto pb-1 wide:sticky wide:top-16 wide:w-60 wide:flex-col wide:items-stretch wide:self-start wide:overflow-visible wide:pb-0"
    >
      <div className="flex shrink-0 items-baseline gap-2">
        {count.state === 'skeleton' ? (
          <>
            <span
              aria-hidden
              className="block h-8 w-10 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
            />
            <span className="sr-only">Loading monitor status</span>
          </>
        ) : (
          <>
            <span
              className={`font-mono text-2xl leading-8 font-semibold tabular-nums ${tone}`}
            >
              {count.state === 'unknown' ? '–' : count.total}
            </span>
            <span className="text-xs leading-4 text-slate-600 dark:text-slate-400">
              monitors down
            </span>
          </>
        )}
      </div>

      {cats.length > 0 && (
        <>
          <hr className="hidden w-full border-0 border-t border-slate-200 dark:border-slate-800 wide:block" />
          <h2 className="shrink-0 self-center text-xs leading-4 font-semibold text-slate-600 wide:self-start dark:text-slate-400">
            Error type
          </h2>
          <div
            role="group"
            aria-label="Filter by error type"
            className="flex shrink-0 gap-2 wide:w-full wide:flex-col"
          >
            {cats.map((c) => {
              const on = active.has(c.category);
              return (
                <button
                  key={c.category}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(c.category)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-2 text-xs leading-4 transition-colors wide:w-full ${
                    on
                      ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${c.dotClass}`} />
                  <span className="whitespace-nowrap">{c.label}</span>
                  <span className="ml-auto font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}
