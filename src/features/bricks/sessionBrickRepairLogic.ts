import type { FocusSession } from '@/types';
import { msToBrickValue, splitBrickValue } from '@/utils';
import { sessionElapsedMs } from '@/utils/sessionTiming';

export function expectedChunksForSession(
  session: FocusSession,
  fractionalEnabled: boolean,
): number[] {
  const total = msToBrickValue(sessionElapsedMs(session), fractionalEnabled);
  return splitBrickValue(total, fractionalEnabled);
}

export function sessionBrickTotals(
  session: FocusSession,
  fractionalEnabled: boolean,
): { count: number; value: number } {
  const chunks = expectedChunksForSession(session, fractionalEnabled);
  return {
    count: chunks.length,
    value: chunks.reduce((sum, v) => sum + v, 0),
  };
}
