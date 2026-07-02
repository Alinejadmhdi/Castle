import { formatUnlockMessage } from '../src/utils/unlockMessages';
import type { UnlockEvent } from '../src/types';

describe('formatUnlockMessage', () => {
  const unlock: UnlockEvent = {
    type: 'macro',
    stageKey: 'low_wall',
    stageName: 'Low Wall',
    cumulativeBricks: 12,
    categoryBrickTotal: 12.4,
  };

  it('shows stage name with cumulative brick threshold', () => {
    expect(formatUnlockMessage(unlock)).toBe('Low Wall · 12 bricks');
  });
});
