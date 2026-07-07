import { getStageForBrickValue } from '@/features/progression/progressionService';
import { focusModeLabel } from '@/utils/formatSession';

describe('focusModeLabel', () => {
  it('labels all focus modes', () => {
    expect(focusModeLabel('strict')).toBe('Strict');
    expect(focusModeLabel('soft')).toBe('Soft');
    expect(focusModeLabel('free')).toBe('Free');
  });
});

describe('building rollback threshold', () => {
  it('drops stage when brick total falls below cumulative threshold', () => {
    const stage5 = getStageForBrickValue(12, 'standard');
    const stage4 = getStageForBrickValue(11.9, 'standard');
    expect(stage5.index).toBeGreaterThan(stage4.index);
  });
});
