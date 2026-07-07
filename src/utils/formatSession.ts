import type { FocusSession } from '@/types';
import { formatBrickValue } from '@/utils';

export function formatSessionDuration(session: FocusSession): string {
  const ms = session.elapsedMs;
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function formatSessionSummary(session: FocusSession): string {
  const date = new Date(session.endedAt ?? session.startedAt).toLocaleDateString();
  const bricks = formatBrickValue(session.bricksEarned);
  return `${date} · ${formatSessionDuration(session)} · ${bricks} brick${session.bricksEarned === 1 ? '' : 's'}`;
}

export function focusModeLabel(mode: string): string {
  if (mode === 'strict') return 'Strict';
  if (mode === 'free') return 'Free';
  return 'Soft';
}
