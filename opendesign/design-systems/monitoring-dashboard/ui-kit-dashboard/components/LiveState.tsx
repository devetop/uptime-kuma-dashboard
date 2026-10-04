import type { LiveSlot } from '../lib/types';

/** Stable text for the last-updated slot. Keyed on data, never on the 1s clock. */
export function LiveState({ slot }: { slot: LiveSlot }) {
  switch (slot.state) {
    case 'loading':
      return 'Loading';
    case 'refreshing':
      return 'Refreshing';
    case 'no-data':
      /* A failed first load never sets updatedAt, so it must not claim "Updated". */
      return 'No data received';
    case 'updated':
      return `Updated ${new Date(slot.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}
