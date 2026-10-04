# Voice and tone

The app is a status readout for an operator mid-incident. It states facts, names failures plainly, and never editorializes.

## Rules observed in the codebase

- **Sentence case everywhere.** No Title Case in body/UI text. The only uppercase is table column headers (`Monitor`, `Last down`) and error-code badges, which are technical identifiers (`ECONNREFUSED`, `HTTP 5xx`).
- **No emoji. No exclamation marks.** Severity is carried by color and position, not punctuation.
- **Name the thing that failed, not the system.** "Could not load monitors" — never "Something went wrong" and never a stack trace as the headline.
- **Literal counts, live.** "6 down", "Showing 3 of 6 down". Never "several" or "a few".
- **Honest unknowns.** When the first load failed, the header says "Status unknown" rather than "0 down", because "0 down" would falsely read as "all up". Empty state says "No monitor data available." This honesty rule is load-bearing: never claim a state the data doesn't support.
- **Buttons: imperative, two words max.** "Refresh", "Retry now", "Clear filter". The header's button always says "Refresh" even during an error — the banner owns "Retry now" so the same CTA label never appears twice.
- **Relative time reads as speech:** "12 minutes ago", "in 30 seconds" (future-capable). Absolute time is always rendered visibly beside it (`<time datetime>`), never tooltip-only.
- **IDs formatted as** "ID #42". Ping as "123.45 ms" — two decimals, space before unit.
- **A11y copy is real copy:** every focusable row is announced once via a single polite live region ("3 of 6 down monitors shown"), skeletons carry `sr-only` labels.
