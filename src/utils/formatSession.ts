import type { Brick, FocusSession } from '@/types';
import { formatBrickValue } from '@/utils';
import { sessionBrickTotals } from '@/features/bricks/sessionBrickRepairLogic';
import { sessionElapsedMs } from '@/utils/sessionTiming';

export function formatSessionDuration(session: FocusSession): string {
  const ms = sessionElapsedMs(session);
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function countSessionBricks(
  bricks: Brick[],
  sessionId: string,
): { count: number; value: number } {
  const linked = bricks.filter((b) => b.sessionId === sessionId);
  return {
    count: linked.length,
    value: linked.reduce((sum, b) => sum + b.fractionalValue, 0),
  };
}

export function formatSessionSummary(
  session: FocusSession,
  placed?: { count: number; value: number },
): string {
  const date = new Date(session.endedAt ?? session.startedAt).toLocaleDateString();
  const duration = formatSessionDuration(session);
  const bricks = placed ?? sessionBrickTotals(session, true);
  const brickWord = bricks.count === 1 ? 'brick' : 'bricks';
  return `${date} · ${duration} · ${bricks.count} ${brickWord} (${formatBrickValue(bricks.value)} hr)`;
}

export function focusModeLabel(mode: string): string {
  if (mode === 'strict') return 'Strict';
  if (mode === 'free') return 'Free';
  return 'Soft';
}
