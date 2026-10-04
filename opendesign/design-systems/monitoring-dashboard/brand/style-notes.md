# Visual foundations

## Color roles

- **Neutrals carry the interface.** Slate 50–950 is the entire chrome: page, panels, borders, text at four ink levels (strong/default/muted/meta). Blue is the *only* interactive accent (primary button, focus ring, links, input focus border).
- **Hue means status.** The eight badge hues (red, rose, yellow, purple, indigo, orange, amber, slate-neutral) appear only in error-category badges and the alarm count. Nothing decorative uses color.
- **Contrast is a contract, not a vibe.** Badge pairs are documented and verified: light ≥ 6:1 text, dark ≥ 8:1 text, borders ≥ 3:1 (WCAG 1.4.11). Focus rings: 5.2:1 light / 6.1:1 dark. Any new color pairing must be verified the same way before shipping.
- Dark mode is a full remap of semantic tokens, not an overlay. Both modes are first-class.

## Type

- Native system sans for UI/prose; **monospace for all data** (counts, IDs, timestamps, ping, error strings) with `tabular-nums` so live-updating numbers don't jitter.
- Three sizes: 16px (h1, card titles), 14px (body, labels, buttons), 12px (meta, badges, headers, code). Line heights fixed at +4px multiples (24/20/16).
- Weights: 400/500/600 only. 600 marks: h1, titles, badge text, the shown-of count, column headers.

## Layout & density

- Centered column, `max-w-6xl` (~1152px), 16px side padding. Sticky header above, one `<main>`.
- **One data container** owns the whole surface: rounded-lg, hairline border, the single `shadow-sm` in the app. Zebra rows live inside it (odd = panel, even = tint, hover = one step darker).
- Responsive model: stacked cards by default, table at ≥45rem — deliberately *no* horizontal scroll trap. Card/table share one `display()` formatter so the views can't drift.
- Spacing on whole 4px steps; rhythm inside rows is 4px between label pairs, 8px between field groups, 16px cell padding (12px vertical tightening at ≥1024px).

## Components & states

- **Buttons:** primary = solid blue-600, hover blue-700, disabled = slate tint (never opacity-faded, keeps contrast). Secondary = hairline border, hover tint. Min height 44px.
- **Badges:** rounded-md, 8×4px padding, 12px semibold mono-capable text, hue token pattern (bg-50/text-800/border-700 light; bg-900@30/text-300/border-500 dark).
- **Inputs:** hairline border, focus border blue-600 + shared focus ring; `type="search"`.
- **Skeletons** mirror real row/card geometry exactly (two lines per cell, ~56px) and pulse with `animate-pulse`; never spinners over content, never blank flash.
- **Error banner:** red-toned rounded-lg block with warning triangle icon, message, and a bordered retry button inside.
- **Icons:** 4 inline SVGs (refresh, warn, sun, moon), 14–16px, stroke 2, round caps, `currentColor`, `aria-hidden`. No icon set ships; no new icons without matching this style.

## Motion

State feedback only: skeleton pulse, refresh spin, 150ms color transitions. `prefers-reduced-motion` collapses all of it to instant. No entrance animations, no parallax, no decoration.
