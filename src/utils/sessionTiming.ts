import type { FocusSession } from '@/types';

/** Elapsed focus time used for brick awards (countdown capped at planned duration). */
export function sessionElapsedMs(session: FocusSession): number {
  if (session.timerMode === 'stopwatch' || session.plannedDurationMs <= 0) {
    return session.elapsedMs;
  }
  return Math.min(session.elapsedMs, session.plannedDurationMs);
}
