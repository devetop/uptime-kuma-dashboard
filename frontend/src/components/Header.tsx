import type { LiveSlot } from '../lib/types';
import { LiveState } from './LiveState';
import { PageHeader } from './PageChrome';

interface Props {
  slot: LiveSlot;
  loading: boolean;
  isDark: boolean;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

/**
 * Dashboard header. The body is the shared PageHeader; only the subtitle is
 * dashboard-specific (it carries the live-state telemetry).
 */
export function Header({ slot, loading, isDark, onRefresh, onToggleTheme }: Props) {
  return (
    <PageHeader
      title="Uptime Kuma Dashboard"
      subtitle={
        <>
          <LiveState slot={slot} /> · auto-refresh 5s
        </>
      }
      loading={loading}
      refreshLabel="Refresh monitors"
      onRefresh={onRefresh}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    />
  );
}
