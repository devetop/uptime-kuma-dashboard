---
name: monitoring-dashboard
description: Design system for the Down Monitors ops dashboard (Uptime Kuma read-only frontend). Slate/blue token set, class-based dark mode, contrast-verified status badges, 4px spacing scale, one elevation, 45rem table/card swap. Use for any screen in this product.
---

# Monitoring Dashboard — design system

Imported from `frontend/` (Tailwind 4.3.3) on 2026-10-04. Canonical tokens: `tokens/colors_and_type.css`.

## Non-negotiable rules (from `src/index.css`)

- **Dark mode is class-based.** `.dark` on `<html>`, never raw `prefers-color-scheme` for styling. Every surface has a light value and a `.dark` remap.
- **Spacing:** whole steps of a 4px base only — 4, 8, 12, 16, 24. No half steps, no arbitrary `min-w-[...]`.
- **Radius:** `--radius-md` (6px) on interactive elements and badges; `--radius-lg` (8px) on the single data container. Nothing else.
- **Elevation:** exactly one `shadow-sm` in the whole app (the data container). Boundaries are hairline borders, never stacked shadows.
- **Surfaces:** never pure `#000`/`#fff` as page background. Light: page `slate-50`, panels `white`. Dark: page `slate-950`, panels `slate-900`. Zebra tint: `slate-50` light / `slate-800` @60% dark.
- **Breakpoint:** one custom variant, `wide` at 45rem, swapping stacked cards (default) for the table. Mobile-first.

## Typography

Two families, native stacks: `--font-sans` for prose/UI, `--font-mono` for all data (counts, IDs, timestamps, ping, error strings) with `tabular-nums`. Scale: 12/16/24 line heights on 12/14/16px. Uppercase + `tracking-wide` appears only on table column headers. Semibold (600) is the heaviest weight used.

## Status color — the badge contract

Error categories are color-coded badges with a fixed token pattern (verified WCAG AA per pair):

| mode | background | text | border |
|---|---|---|---|
| light | `--<c>-50` | `--<c>-800` | `--<c>-700` |
| dark | `--<c>-900` @30% | `--<c>-300` | `--<c>-500` |

Categories: REFUSED=red, UNREACHABLE=rose, TIMEOUT=yellow, DNS=purple, TLS=indigo, HTTP_5XX=orange, HTTP_4XX=amber, OTHER/UNKNOWN=slate (neutral — never alarms). The header count badge uses the same pattern (alarm=red only when total > 0).

## Interaction

- One focus treatment app-wide: 2px solid outline, offset 2px, `blue-600` light / `blue-400` dark; rows/cards use inset offset (-2px).
- Touch targets ≥ 44px (`min-h-11` / `size-11`).
- Motion is state feedback only (skeleton pulse, refresh spin). `prefers-reduced-motion` collapses everything to instant.
- Hover = one step darker on the surface scale (`slate-100` rows, `blue-700` button). `transition-colors` only.

## Copy voice

Plain English, sentence case, no emoji. Failures name the thing that failed, not the system: "Could not load monitors". Counts are literal: "6 down", "Showing 3 of 6 down". Buttons are short verbs: "Refresh", "Retry now", "Clear filter". Relative time reads as speech: "12 minutes ago". IDs as "ID #42".
