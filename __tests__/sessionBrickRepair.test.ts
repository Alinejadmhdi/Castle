import {
  expectedChunksForSession,
  sessionBrickTotals,
} from '@/features/bricks/sessionBrickRepairLogic';
import type { FocusSession } from '@/types';

describe('sessionBrickRepairLogic', () => {
  const oneHour: FocusSession = {
    id: 's1',
    categoryId: 'c1',
    brickColor: '#8844cc',
    plannedDurationMs: 3_600_000,
    elapsedMs: 3_600_000,
    startedAt: '2026-07-07T10:00:00.000Z',
    endedAt: '2026-07-07T11:00:00.000Z',
    status: 'completed',
    pauseCount: 0,
    bricksEarned: 2,
    timerMode: 'countdown',
  };

  it('expects one brick chunk for a 1-hour countdown session', () => {
    expect(expectedChunksForSession(oneHour, true)).toEqual([1]);
    expect(sessionBrickTotals(oneHour, true)).toEqual({ count: 1, value: 1 });
  });

  it('caps elapsed time at planned duration', () => {
    const overtime = { ...oneHour, elapsedMs: 7_200_000, bricksEarned: 2 };
    expect(expectedChunksForSession(overtime, true)).toEqual([1]);
  });
});
