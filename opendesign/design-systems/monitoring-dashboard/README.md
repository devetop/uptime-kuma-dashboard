# Monitoring Dashboard — design system

The visual language of **Down Monitors**, a read-only Uptime Kuma dashboard: sticky header with a live count badge, error banner, filter input, a "Showing X of Y / Updated hh:mm" line, and one data container that renders as stacked cards below 45rem and a zebra-striped table above it. Error messages are classified into color-coded badges. Dark mode is a `.dark` class on `<html>` with anti-FOUC inline script.

The brand is an ops tool: quiet, neutral slate surfaces with a single blue accent; color is reserved almost entirely for *status* (badge hues and the alarm count). Density over decoration — hairline borders, one shadow, monospace data.

## Sources consulted (codebase is the source of truth)

- `frontend/src/index.css` — spacing/radius/elevation/surface conventions, focus ring, reduced-motion, dark custom-variant, `wide` breakpoint
- `frontend/src/lib/errors.ts` — badge palette + documented contrast contract
- `frontend/src/components/Header.tsx` — count-badge alarm/neutral tones, button styling
- `frontend/src/components/DownMonitorRow.tsx` — row/card tokens (NAME, META, NUM, VALUE, DURATION, CODE, ROW_SURFACE), skeletons
- `frontend/src/components/{MonitorTable,MonitorCards,ErrorBanner,EmptyState,LiveState,icons}.tsx` — table head, banner, empty state, live slot, inline SVG icons
- `frontend/src/hooks/useTheme.ts` + `frontend/index.html` — dark-mode resolution order
- `frontend/src/lib/time.ts` — relative/absolute time formats
- `tailwindcss@4.3.3 theme.css` — exact oklch values for every step used

## Index

| path | what |
|---|---|
| `tokens/colors_and_type.css` | raw + semantic tokens, light & dark |
| `SKILL.md` | portable rules summary |
| `brand/voice-and-tone.md` | copy rules |
| `brand/style-notes.md` | visual foundations in prose |
| `ui-kit-dashboard/index.html` | interactive showcase of the core screens (token-driven static HTML; light/dark toggle) |
| `ui-kit-dashboard/components/*.jsx` | verbatim recreations of the existing components (Tailwind classes map 1:1 to tokens) |

## Notes on fidelity

- No logo, imagery, or icon *files* exist in the codebase — icons are inline SVGs inside `icons.tsx`, reproduced as-is. No `assets/` folder is shipped.
- Fonts are native system stacks by deliberate choice (`AGENTS.md` forbids new dependencies); no `fonts/` folder.
- The token CSS includes only observed palette steps (documented ceiling inside the file).
